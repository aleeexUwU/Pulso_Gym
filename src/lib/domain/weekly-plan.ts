import { diaSemana, sumarDias } from "./dates";
import type { Plan, Settings } from "./types";

export type TipoActividad = "gimnasio" | "abdominales" | "brazo";

export interface ActividadDia {
  fecha: string;
  tipo: TipoActividad;
  titulo: string;
  planDayId?: string;
}

/**
 * Plan de la semana a partir del lunes `desde`: días de gimnasio del plan,
 * abdominales diarios (o los días configurados) y brazo izquierdo SOLO si el
 * módulo está activado.
 */
export function planSemanal(
  desde: string,
  plan: Plan | null,
  settings: Pick<Settings, "moduloBrazo" | "abdominalesDiasSemana">,
  diasBrazo: number[] = [],
): ActividadDia[] {
  const out: ActividadDia[] = [];
  const nAbs = Math.max(0, Math.min(7, settings.abdominalesDiasSemana));
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(desde, i);
    const wd = diaSemana(fecha);
    const dia = plan?.dias.find((d) => d.diaSemana === wd);
    if (dia) out.push({ fecha, tipo: "gimnasio", titulo: dia.nombre, planDayId: dia.id });
    if (i < nAbs) out.push({ fecha, tipo: "abdominales", titulo: "Core en casa" });
    if (settings.moduloBrazo && diasBrazo.includes(wd)) {
      out.push({ fecha, tipo: "brazo", titulo: "Brazo izquierdo" });
    }
  }
  return out;
}

/** Racha de días consecutivos con actividad hasta hoy (si hoy aún no, cuenta desde ayer). */
export function racha(fechasHechas: Iterable<string>, hoy: string): number {
  const set = new Set(fechasHechas);
  let d = set.has(hoy) ? hoy : sumarDias(hoy, -1);
  let n = 0;
  while (set.has(d)) {
    n += 1;
    d = sumarDias(d, -1);
  }
  return n;
}

/** Racha más larga de la historia. */
export function mejorRacha(fechasHechas: Iterable<string>): number {
  const ordenadas = [...new Set(fechasHechas)].sort();
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const f of ordenadas) {
    cur = prev && sumarDias(prev, 1) === f ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = f;
  }
  return best;
}
