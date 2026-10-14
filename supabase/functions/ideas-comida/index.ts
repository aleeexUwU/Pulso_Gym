// Supabase Edge Function: ideas de comida con lo que hay en la nevera, ajustadas a lo
// que le falta a la persona en su próxima comida (kcal y macros). Devuelve 3 ideas con
// ingredientes en gramos, sus nutrientes y pasos cortos. Solo para cuentas autorizadas
// (public.ia_autorizados). Gemini (gratis) primero y Claude Haiku de respaldo.

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk@0.133.0/helpers/zod";
import { z } from "npm:zod@4.6.7";
import { CORS, respuesta, usuarioAutorizado } from "../_shared/autorizacion.ts";

const Ingrediente = z.object({
  nombre: z.string(),
  gramos: z.number(),
  kcal: z.number(),
  proteinas: z.number(),
  carbohidratos: z.number(),
  grasas: z.number(),
  fibra: z.number(),
  azucares: z.number(),
  sal: z.number(),
});
const Idea = z.object({
  nombre: z.string(),
  momento: z.enum(["snack", "comida"]),
  minutos: z.number(),
  ingredientes: z.array(Ingrediente),
  pasos: z.array(z.string()),
});
const Respuesta = z.object({ ideas: z.array(Idea) });
type Respuesta = z.infer<typeof Respuesta>;

const SISTEMA = `Eres un dietista-nutricionista y cocinero práctico en España. Propones 3 ideas de comida rápidas y apetecibles usando sobre todo lo que la persona dice que tiene (puedes añadir básicos de despensa: aceite, sal, especias, ajo, cebolla, pan, huevos, arroz o pasta solo si hace falta, y dilo en los pasos).
- Ajusta las cantidades para acercarte a las calorías y macros objetivo de ESTA comida, priorizando llegar a la proteína sin pasarte de calorías.
- Ingredientes en gramos (en crudo salvo que digas "cocido") con sus nutrientes para esa cantidad (tablas BEDCA/USDA), proteinas/carbohidratos/grasas/fibra/azucares/sal en gramos.
- pasos: 2-4 pasos cortos. minutos: tiempo total realista.
- Si la persona tiene limitaciones (p. ej. cocinar con una sola mano), adapta los pasos.
- Responde en español.`;

const NUM = { type: "NUMBER" };
const ESQUEMA_GEMINI = {
  type: "OBJECT",
  properties: {
    ideas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          nombre: { type: "STRING" },
          momento: { type: "STRING", enum: ["snack", "comida"] },
          minutos: NUM,
          ingredientes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { nombre: { type: "STRING" }, gramos: NUM, kcal: NUM, proteinas: NUM, carbohidratos: NUM, grasas: NUM, fibra: NUM, azucares: NUM, sal: NUM },
              required: ["nombre", "gramos", "kcal", "proteinas", "carbohidratos", "grasas", "fibra", "azucares", "sal"],
            },
          },
          pasos: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["nombre", "momento", "minutos", "ingredientes", "pasos"],
      },
    },
  },
  required: ["ideas"],
};

async function conGemini(clave: string, prompt: string): Promise<Respuesta> {
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
  const r = Respuesta.safeParse(JSON.parse(texto));
  if (!r.success) throw new Error("respuesta de Gemini con formato inesperado");
  return r.data;
}

async function conClaude(prompt: string): Promise<Respuesta> {
  const client = new Anthropic();
  const msg = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(Respuesta) },
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

  let cuerpo: {
    nevera?: string;
    objetivo?: { kcal: number; proteinas: number; carbohidratos: number; grasas: number };
    momento?: string;
    limitaciones?: string;
  };
  try {
    cuerpo = await req.json();
  } catch {
    return respuesta({ error: "Cuerpo JSON no válido" }, 400);
  }
  const nevera = (cuerpo.nevera ?? "").slice(0, 1000).trim();
  if (!nevera) return respuesta({ error: "Escribe qué tienes en la nevera." }, 400);
  const o = cuerpo.objetivo ?? { kcal: 600, proteinas: 35, carbohidratos: 60, grasas: 20 };
  const r = (x: number) => Math.max(0, Math.round(x));
  const prompt = `Tengo en la nevera / despensa: ${nevera}
Momento: ${cuerpo.momento === "snack" ? "un snack" : "una comida o cena"}.
Objetivo aproximado para esta comida: ${r(o.kcal)} kcal, ${r(o.proteinas)} g de proteína, ${r(o.carbohidratos)} g de hidratos, ${r(o.grasas)} g de grasa.${
    cuerpo.limitaciones ? `\nLimitaciones de la persona: ${cuerpo.limitaciones.slice(0, 300)}` : ""
  }`;

  const claveGemini = Deno.env.get("GEMINI_API_KEY");
  const hayClaude = Boolean(Deno.env.get("ANTHROPIC_API_KEY"));
  let fallo = "";
  if (claveGemini) {
    try {
      return respuesta({ ...(await conGemini(claveGemini, prompt)), proveedor: "Gemini" });
    } catch (e) {
      fallo = e instanceof Error ? e.message : "error con Gemini";
    }
  }
  if (hayClaude) {
    try {
      return respuesta({ ...(await conClaude(prompt)), proveedor: "Claude Haiku" });
    } catch (e) {
      fallo = e instanceof Error ? e.message : "error con Claude";
    }
  }
  return respuesta({ error: `No se pudo generar ideas: ${fallo || "no hay proveedor de IA configurado"}.` }, 502);
});
