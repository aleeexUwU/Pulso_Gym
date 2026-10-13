import type { Exercise } from "../types";
import { EJERCICIOS_ABDOMINALES } from "./abs";
import { EJERCICIOS_GIMNASIO } from "./gym";

export { EJERCICIOS_ABDOMINALES, EJERCICIOS_GIMNASIO };

export const EJERCICIOS: Exercise[] = [...EJERCICIOS_GIMNASIO, ...EJERCICIOS_ABDOMINALES];

const POR_ID = new Map(EJERCICIOS.map((e) => [e.id, e]));

export function getEjercicio(id: string): Exercise | undefined {
  return POR_ID.get(id);
}

export function ejercicio(id: string): Exercise {
  const e = POR_ID.get(id);
  if (!e) throw new Error(`Ejercicio desconocido: ${id}`);
  return e;
}

/** Ruta de las imágenes (0 y 1) de un ejercicio, o null si no tiene foto. */
export function imagenesEjercicio(e: Exercise): string[] | null {
  if (!e.imagen) return null;
  return [`/ejercicios/${e.imagen}/0.webp`, `/ejercicios/${e.imagen}/1.webp`];
}
