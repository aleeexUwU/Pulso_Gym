// Supabase Edge Function: lee lo que una persona cuenta de sus lesiones o limitaciones
// físicas y propone cómo adaptar la rutina: qué limitaciones de la app aplicar y qué
// ejercicios del catálogo quitar. La app enseña la propuesta y la persona decide.
//
// Mismo esquema que analizar-comida: Gemini (gratis) primero y Claude Haiku de respaldo.
// Solo para cuentas que estén en public.ia_autorizados.

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.133.0/helpers/zod";
import { z } from "npm:zod@4.6.7";
import { CORS, respuesta, usuarioAutorizado } from "../_shared/autorizacion.ts";

const Propuesta = z.object({
  limitaciones: z.array(z.string()),
  excluir: z.array(z.string()),
  resumen: z.string(),
  consultar_profesional: z.boolean(),
});
type Propuesta = z.infer<typeof Propuesta>;

const SISTEMA = `Eres un entrenador personal con formación en readaptación de lesiones. Una persona te cuenta, con sus palabras, lesiones, molestias o limitaciones físicas. Tu tarea es adaptar su rutina de gimnasio usando SOLO las opciones que te da la app:
- limitaciones: ids de la lista de limitaciones disponibles que encajen con lo que cuenta (ninguno si no encaja ninguno).
- excluir: ids de ejercicios del catálogo que esa persona no debería hacer por lo que cuenta (sé concreto; no quites ejercicios sin motivo).
- resumen: 2-4 frases en español, en segunda persona, explicando qué se adapta y por qué, y qué vigilar.
- consultar_profesional: true si lo que cuenta es reciente, agudo, con dolor fuerte o requiere valoración médica antes de entrenar.
No diagnostiques. Usa solo ids exactos de las listas.`;

const ESQUEMA_GEMINI = {
  type: "OBJECT",
  properties: {
    limitaciones: { type: "ARRAY", items: { type: "STRING" } },
    excluir: { type: "ARRAY", items: { type: "STRING" } },
    resumen: { type: "STRING" },
    consultar_profesional: { type: "BOOLEAN" },
  },
  required: ["limitaciones", "excluir", "resumen", "consultar_profesional"],
};

async function conGemini(clave: string, prompt: string): Promise<Propuesta> {
  const modelo = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": clave, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SISTEMA }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMA_GEMINI },
    }),
  });
  if (!res.ok) throw new Error(res.status === 429 ? "límite gratuito de Gemini agotado" : `Gemini respondió ${res.status}`);
  const json = await res.json();
  const texto: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p.text === "string")?.text;
  if (!texto) throw new Error("Gemini no devolvió texto");
  const r = Propuesta.safeParse(JSON.parse(texto));
  if (!r.success) throw new Error("respuesta de Gemini con formato inesperado");
  return r.data;
}

async function conClaude(prompt: string): Promise<Propuesta> {
  const client = new Anthropic();
  const msg = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(Propuesta) },
    system: SISTEMA,
    messages: [{ role: "user", content: prompt }],
  });
  if (!msg.parsed_output) throw new Error("respuesta de Claude con formato inesperado");
  return msg.parsed_output;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return respuesta({ error: "Método no permitido" }, 405);

  const acceso = await usuarioAutorizado(req);
  if (acceso instanceof Response) return acceso;

  let cuerpo: { texto?: string; limitaciones?: { id: string; nombre: string }[]; ejercicios?: { id: string; nombre: string }[] };
  try {
    cuerpo = await req.json();
  } catch {
    return respuesta({ error: "Cuerpo JSON no válido" }, 400);
  }
  const texto = (cuerpo.texto ?? "").slice(0, 2000).trim();
  const limitaciones = (cuerpo.limitaciones ?? []).slice(0, 30);
  const ejercicios = (cuerpo.ejercicios ?? []).slice(0, 300);
  if (!texto) return respuesta({ error: "Cuenta qué te pasa para poder adaptar la rutina." }, 400);

  const prompt = `Lo que cuenta la persona: """${texto}"""

Limitaciones disponibles (id: nombre):
${limitaciones.map((l) => `${l.id}: ${l.nombre}`).join("\n")}

Catálogo de ejercicios (id: nombre):
${ejercicios.map((e) => `${e.id}: ${e.nombre}`).join("\n")}`;

  const claveGemini = Deno.env.get("GEMINI_API_KEY");
  const hayClaude = Boolean(Deno.env.get("ANTHROPIC_API_KEY"));
  let propuesta: Propuesta | null = null;
  let fallo = "";
  if (claveGemini) {
    try {
      propuesta = await conGemini(claveGemini, prompt);
    } catch (e) {
      fallo = e instanceof Error ? e.message : "error con Gemini";
    }
  }
  if (!propuesta && hayClaude) {
    try {
      propuesta = await conClaude(prompt);
    } catch (e) {
      fallo = e instanceof Error ? e.message : "error con Claude";
    }
  }
  if (!propuesta) return respuesta({ error: `No se pudo analizar: ${fallo || "no hay proveedor de IA configurado"}.` }, 502);

  // Solo ids que existen de verdad.
  const idsLim = new Set(limitaciones.map((l) => l.id));
  const idsEj = new Set(ejercicios.map((e) => e.id));
  return respuesta({
    ...propuesta,
    limitaciones: [...new Set(propuesta.limitaciones)].filter((id) => idsLim.has(id)),
    excluir: [...new Set(propuesta.excluir)].filter((id) => idsEj.has(id)),
  });
});
