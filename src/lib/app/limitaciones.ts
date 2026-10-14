import { EJERCICIOS } from "@/lib/domain/exercises";
import { LIMITACIONES } from "@/lib/domain/limitations";
import type { LimitationId } from "@/lib/domain/types";
import { supabase } from "@/lib/sync/supabase";

export interface PropuestaIA {
  limitaciones: LimitationId[];
  excluir: string[];
  resumen: string;
  consultar_profesional: boolean;
}

/** Pide a la IA (función adaptar-rutina) cómo adaptar la rutina a lo que cuenta la persona. */
export async function adaptarConIA(texto: string): Promise<PropuestaIA> {
  const sb = supabase();
  if (!sb) throw new Error("La IA necesita Supabase configurado.");
  const { data, error } = await sb.functions.invoke<PropuestaIA & { error?: string }>("adaptar-rutina", {
    body: {
      texto,
      limitaciones: LIMITACIONES.map((l) => ({ id: l.id, nombre: `${l.nombre}. ${l.descripcion}` })),
      ejercicios: EJERCICIOS.map((e) => ({ id: e.id, nombre: e.nombre })),
    },
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
  if (!data) throw new Error("Respuesta vacía de la IA.");
  return data;
}
