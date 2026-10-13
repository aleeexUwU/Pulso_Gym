// Supabase Edge Function: estima los nutrientes de una comida a partir de una foto
// o de una descripción.
//
// Proveedores (las claves viven SOLO aquí, como secretos de Supabase):
//   1. Google Gemini (GEMINI_API_KEY): nivel gratuito. En el nivel gratuito Google
//      puede usar el contenido para mejorar sus productos.
//   2. Claude Haiku (ANTHROPIC_API_KEY): de pago, ~0,2 céntimos por foto. Se usa si
//      no hay clave de Gemini o si Gemini falla (p. ej. límite diario agotado).
// PROVEEDOR_IA=claude|gemini fuerza uno concreto. GEMINI_MODEL cambia el modelo de Gemini.
//
// Seguridad y coste: exige sesión y que el email esté en ALLOWED_EMAILS (lista
// separada por comas). Sin esa variable la función se niega a responder.

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.133.0/helpers/zod";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type TipoImagen = (typeof TIPOS_IMAGEN)[number];

const Item = z.object({
  nombre: z.string(),
  gramos: z.number(),
  kcal: z.number(),
  proteinas: z.number(),
  carbohidratos: z.number(),
  grasas: z.number(),
  fibra: z.number(),
  azucares: z.number(),
  sal: z.number(),
  confianza: z.enum(["alta", "media", "baja"]),
});

const Resultado = z.object({
  es_comida: z.boolean(),
  descripcion: z.string(),
  items: z.array(Item),
  notas: z.string(),
});
type Resultado = z.infer<typeof Resultado>;

const SISTEMA = `Eres un dietista-nutricionista que estima el contenido nutricional de comidas para una app de seguimiento personal en España.
- Desglosa la comida en alimentos individuales (incluye aceite de cocinado, salsas y bebidas si se ven o se mencionan).
- Estima las cantidades en gramos a partir de lo que se ve (tamaño del plato, cubiertos, envases) o de lo que se describe. Si no se dan cantidades, usa raciones típicas españolas.
- Usa valores de composición estándar (tablas tipo BEDCA/USDA) y calcula los nutrientes para la cantidad estimada, no por 100 g. proteinas, carbohidratos, grasas, fibra, azucares y sal en gramos.
- Si una etiqueta nutricional es legible, úsala y marca confianza alta.
- Sé realista: no infles ni rebajes. Marca confianza baja cuando la cantidad sea muy incierta.
- Si no hay comida ni bebida, devuelve es_comida=false e items vacío.
- descripcion: resumen breve del plato. notas: supuestos hechos (ración, aceite...) en una o dos frases.
Responde en español.`;

class ErrorProveedor extends Error {
  constructor(
    mensaje: string,
    readonly status: number,
    readonly reintentable: boolean,
  ) {
    super(mensaje);
  }
}

// ── Gemini (REST generateContent con salida JSON) ──

const NUM = { type: "NUMBER" };
const ESQUEMA_GEMINI = {
  type: "OBJECT",
  properties: {
    es_comida: { type: "BOOLEAN" },
    descripcion: { type: "STRING" },
    notas: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          nombre: { type: "STRING" },
          gramos: NUM,
          kcal: NUM,
          proteinas: NUM,
          carbohidratos: NUM,
          grasas: NUM,
          fibra: NUM,
          azucares: NUM,
          sal: NUM,
          confianza: { type: "STRING", enum: ["alta", "media", "baja"] },
        },
        required: ["nombre", "gramos", "kcal", "proteinas", "carbohidratos", "grasas", "fibra", "azucares", "sal", "confianza"],
      },
    },
  },
  required: ["es_comida", "descripcion", "items", "notas"],
};

async function conGemini(clave: string, prompt: string, imagen?: { data: string; tipo: TipoImagen }): Promise<Resultado> {
  const modelo = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
  const partes: unknown[] = [];
  if (imagen) partes.push({ inlineData: { mimeType: imagen.tipo, data: imagen.data } });
  partes.push({ text: prompt });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": clave, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SISTEMA }] },
      contents: [{ role: "user", parts: partes }],
      generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMA_GEMINI },
    }),
  });
  if (!res.ok) {
    const reintentable = res.status === 429 || res.status >= 500;
    const motivo = res.status === 429 ? "límite gratuito de Gemini agotado" : `Gemini respondió ${res.status}`;
    throw new ErrorProveedor(motivo, res.status, reintentable || res.status === 404 || res.status === 400);
  }
  const json = await res.json();
  const texto: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p.text === "string")?.text;
  if (!texto) throw new ErrorProveedor("Gemini no devolvió texto", 502, true);
  const r = Resultado.safeParse(JSON.parse(texto));
  if (!r.success) throw new ErrorProveedor("Respuesta de Gemini con formato inesperado", 502, true);
  return r.data;
}

// ── Claude Haiku (SDK oficial con salida estructurada) ──

async function conClaude(prompt: string, imagen?: { data: string; tipo: TipoImagen }): Promise<Resultado> {
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY de los secretos
  const contenido: Anthropic.ContentBlockParam[] = [];
  if (imagen) contenido.push({ type: "image", source: { type: "base64", media_type: imagen.tipo, data: imagen.data } });
  contenido.push({ type: "text", text: prompt });
  try {
    const msg = await client.messages.parse({
      model: "claude-haiku-5-5",
      max_tokens: 16000,
      output_config: { effort: "low", format: zodOutputFormat(Resultado) },
      system: SISTEMA,
      messages: [{ role: "user", content: contenido }],
    });
    if (msg.stop_reason === "refusal") throw new ErrorProveedor("La IA no pudo analizar esta imagen", 422, false);
    if (!msg.parsed_output) throw new ErrorProveedor("Respuesta de Claude con formato inesperado", 502, false);
    return msg.parsed_output;
  } catch (e) {
    if (e instanceof ErrorProveedor) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new ErrorProveedor("La clave de Anthropic no es válida", 500, false);
    if (e instanceof Anthropic.RateLimitError) throw new ErrorProveedor("Demasiadas peticiones a Claude", 429, false);
    if (e instanceof Anthropic.APIError) throw new ErrorProveedor(`Claude respondió ${e.status}`, 502, false);
    throw new ErrorProveedor("Error inesperado con Claude", 500, false);
  }
}

function respuesta(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return respuesta({ error: "Método no permitido" }, 405);

  // 1) Usuario autenticado y autorizado.
  const permitidos = (Deno.env.get("ALLOWED_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (permitidos.length === 0) return respuesta({ error: "Falta configurar ALLOWED_EMAILS en los secretos de la función." }, 403);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: usuario } = await supabase.auth.getUser();
  const email = usuario.user?.email?.toLowerCase();
  if (!email) return respuesta({ error: "Inicia sesión para usar el análisis con IA." }, 401);
  if (!permitidos.includes(email)) return respuesta({ error: "Tu cuenta no tiene acceso al análisis con IA." }, 403);

  // 2) Entrada: texto y/o imagen en base64.
  let cuerpo: { texto?: string; imagen?: string; tipoImagen?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return respuesta({ error: "Cuerpo JSON no válido" }, 400);
  }
  const texto = (cuerpo.texto ?? "").slice(0, 2000).trim();
  const data = cuerpo.imagen?.replace(/^data:[^,]+,/, "");
  const tipo = (cuerpo.tipoImagen ?? "image/jpeg") as TipoImagen;
  if (!texto && !data) return respuesta({ error: "Envía una foto o una descripción." }, 400);
  if (data && (!TIPOS_IMAGEN.includes(tipo) || (data.length * 3) / 4 > MAX_IMAGEN_BYTES)) {
    return respuesta({ error: "Imagen no válida o mayor de 5 MB." }, 400);
  }
  const imagen = data ? { data, tipo } : undefined;
  const prompt = imagen
    ? `Estima los nutrientes de esta comida.${texto ? ` Contexto del usuario: ${texto}` : ""}`
    : `Estima los nutrientes de esto que he comido: ${texto}`;

  // 3) Gemini primero (gratis); Claude Haiku si no hay clave o Gemini falla.
  const claveGemini = Deno.env.get("GEMINI_API_KEY");
  const hayClaude = Boolean(Deno.env.get("ANTHROPIC_API_KEY"));
  const forzado = Deno.env.get("PROVEEDOR_IA");
  if (!claveGemini && !hayClaude) return respuesta({ error: "Falta GEMINI_API_KEY o ANTHROPIC_API_KEY en los secretos." }, 500);

  let avisoGemini: string | null = null;
  if (claveGemini && forzado !== "claude") {
    try {
      return respuesta({ ...(await conGemini(claveGemini, prompt, imagen)), proveedor: "Gemini" });
    } catch (e) {
      const err = e instanceof ErrorProveedor ? e : new ErrorProveedor("Error inesperado con Gemini", 500, true);
      if (!hayClaude || !err.reintentable || forzado === "gemini") return respuesta({ error: `No se pudo analizar: ${err.message}.` }, err.status);
      avisoGemini = err.message;
    }
  }
  try {
    const r = await conClaude(prompt, imagen);
    return respuesta({ ...r, proveedor: avisoGemini ? `Claude Haiku (${avisoGemini})` : "Claude Haiku" });
  } catch (e) {
    const err = e instanceof ErrorProveedor ? e : new ErrorProveedor("Error inesperado", 500, false);
    return respuesta({ error: `No se pudo analizar: ${err.message}.` }, err.status);
  }
});
