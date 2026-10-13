// Supabase Edge Function: estima los nutrientes de una comida a partir de una foto
// o de una descripción, usando Claude. La clave de Anthropic vive SOLO aquí
// (secreto ANTHROPIC_API_KEY), nunca en la app.
//
// Seguridad y coste: exige un usuario con sesión y, además, que su email esté en
// ALLOWED_EMAILS (lista separada por comas). Sin esa variable, la función se niega:
// así nadie que se registre en tu proyecto puede gastar tu saldo.

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { betaZodOutputFormat } from "npm:@anthropic-ai/sdk@0.133.0/helpers/beta/zod";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const Item = z.object({
  nombre: z.string().describe("Nombre del alimento en español, concreto (p. ej. 'Arroz blanco cocido')"),
  gramos: z.number().describe("Cantidad estimada en gramos (o ml si es bebida)"),
  kcal: z.number(),
  proteinas: z.number().describe("g"),
  carbohidratos: z.number().describe("g"),
  grasas: z.number().describe("g"),
  fibra: z.number().describe("g"),
  azucares: z.number().describe("g"),
  sal: z.number().describe("g"),
  confianza: z.enum(["alta", "media", "baja"]),
});

const Resultado = z.object({
  es_comida: z.boolean().describe("false si la imagen o el texto no muestran comida ni bebida"),
  descripcion: z.string().describe("Resumen breve del plato o comida, en español"),
  items: z.array(Item),
  notas: z.string().describe("Supuestos hechos (tamaño de ración, aceite de cocinado...) en una o dos frases"),
});

const SISTEMA = `Eres un dietista-nutricionista que estima el contenido nutricional de comidas para una app de seguimiento personal en España.
- Desglosa la comida en alimentos individuales (incluye aceite de cocinado, salsas y bebidas si se ven o se mencionan).
- Estima las cantidades en gramos a partir de lo que se ve (tamaño del plato, cubiertos, envases) o de lo que se describe. Si no se dan cantidades, usa raciones típicas españolas.
- Usa valores de composición estándar (tablas tipo BEDCA/USDA) y calcula los nutrientes para la cantidad estimada, no por 100 g.
- Si una etiqueta nutricional es legible, úsala y marca confianza alta.
- Sé realista: no infles ni rebajes. Marca confianza baja cuando la cantidad sea muy incierta.
- Si no hay comida ni bebida, devuelve es_comida=false y items vacío.
Responde en español.`;

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
  if (permitidos.length === 0) {
    return respuesta({ error: "Falta configurar ALLOWED_EMAILS en los secretos de la función." }, 403);
  }
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
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
  const imagen = cuerpo.imagen?.replace(/^data:[^,]+,/, "");
  const tipo = (cuerpo.tipoImagen ?? "image/jpeg") as (typeof TIPOS_IMAGEN)[number];
  if (!texto && !imagen) return respuesta({ error: "Envía una foto o una descripción." }, 400);
  if (imagen && (!TIPOS_IMAGEN.includes(tipo) || (imagen.length * 3) / 4 > MAX_IMAGEN_BYTES)) {
    return respuesta({ error: "Imagen no válida o mayor de 5 MB." }, 400);
  }

  const contenido: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (imagen) contenido.push({ type: "image", source: { type: "base64", media_type: tipo, data: imagen } });
  contenido.push({
    type: "text",
    text: imagen
      ? `Estima los nutrientes de esta comida.${texto ? ` Contexto del usuario: ${texto}` : ""}`
      : `Estima los nutrientes de esto que he comido: ${texto}`,
  });

  // 3) Llamada a Claude con salida estructurada. Si el modelo rechaza la petición,
  //    `fallbacks: "default"` la reintenta en el servidor con el modelo recomendado.
  const client = new Anthropic(); // lee ANTHROPIC_API_KEY de los secretos
  try {
    const msg = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Resultado) },
      system: SISTEMA,
      messages: [{ role: "user", content: contenido }],
    });
    if (msg.stop_reason === "refusal") {
      return respuesta({ error: "No se pudo analizar esta imagen. Prueba a describirla con texto." }, 422);
    }
    if (!msg.parsed_output) return respuesta({ error: "La respuesta no tenía el formato esperado." }, 502);
    return respuesta({ ...msg.parsed_output, modelo: msg.model });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return respuesta({ error: "La clave de Anthropic no es válida (revisa ANTHROPIC_API_KEY)." }, 500);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return respuesta({ error: "Demasiadas peticiones: espera un momento." }, 429);
    }
    if (e instanceof Anthropic.APIError) {
      return respuesta({ error: `Error de la IA (${e.status}).` }, 502);
    }
    return respuesta({ error: "Error inesperado analizando la comida." }, 500);
  }
});
