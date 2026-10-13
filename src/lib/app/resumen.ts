import type { AbsSession, ArmSession, Workout } from "@/lib/db/types";

/** Claves "fecha|tipo" de todo lo completado (para calendario, semana y rachas). */
export function clavesHechas(
  workouts: Workout[] = [],
  abs: AbsSession[] = [],
  brazo: ArmSession[] = [],
): Set<string> {
  const s = new Set<string>();
  for (const w of workouts) if (w.estado === "completado") s.add(`${w.fecha}|gimnasio`);
  for (const a of abs) if (a.completado) s.add(`${a.fecha}|abdominales`);
  for (const b of brazo) if (b.completado) s.add(`${b.fecha}|brazo`);
  return s;
}

export function fechasDe(claves: Set<string>, tipo?: string): string[] {
  return [...claves].filter((k) => !tipo || k.endsWith(`|${tipo}`)).map((k) => k.split("|")[0]);
}
