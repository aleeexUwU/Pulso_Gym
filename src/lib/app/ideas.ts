import { nutrientesDe } from "@/lib/domain/nutrition/alimentos";
import type { Falta } from "@/lib/domain/nutrition/completar";
import type { ItemComida } from "@/lib/domain/nutrition/parser";
import { supabase } from "@/lib/sync/supabase";

export interface IdeaIA {
  nombre: string;
  momento: "snack" | "comida";
  minutos: number;
  items: ItemComida[];
  pasos: string[];
}

interface RespuestaIdeas {
  ideas: {
    nombre: string;
    momento: "snack" | "comida";
    minutos: number;
    ingredientes: Omit<ItemComida, "por100" | "alimentoId" | "confianza">[];
    pasos: string[];
  }[];
  error?: string;
}

/** Ideas de comida con lo que hay en la nevera (función ideas-comida, solo con IA autorizada). */
export async function ideasConIA(nevera: string, objetivo: Falta, momento: "snack" | "comida", limitaciones?: string): Promise<IdeaIA[]> {
  const sb = supabase();
  if (!sb) throw new Error("La IA necesita Supabase configurado.");
  const { data, error } = await sb.functions.invoke<RespuestaIdeas>("ideas-comida", {
    body: { nevera, objetivo, momento, limitaciones },
  });
  if (error) {
    let mensaje = error.message;
    try {
      const cuerpo = await (error as { context?: Response }).context?.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch {
      /* sin cuerpo */
    }
    throw new Error(mensaje);
  }
  if (!data?.ideas?.length) throw new Error("La IA no ha propuesto nada. Prueba a escribir más ingredientes.");
  return data.ideas.map((i) => ({
    nombre: i.nombre,
    momento: i.momento,
    minutos: Math.round(i.minutos),
    pasos: i.pasos,
    items: i.ingredientes.map((it) => ({
      ...it,
      gramos: Math.max(1, Math.round(it.gramos)),
      confianza: "media" as const,
      por100: it.gramos > 0 ? nutrientesDe(it, (100 / it.gramos) * 100) : undefined,
    })),
  }));
}
