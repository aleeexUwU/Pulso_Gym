import { getEjercicio } from "./exercises";
import { coberturaVacia, GRUPOS } from "./muscles";
import type { Coverage, MuscleGroup, PlanDay } from "./types";

/** Series efectivas por grupo: 1 por serie si es músculo principal, fracción si es secundario. */
export function coberturaDeDias(dias: Pick<PlanDay, "ejercicios">[]): Coverage {
  const cov = coberturaVacia();
  for (const d of dias) {
    for (const pe of d.ejercicios) {
      const e = getEjercicio(pe.exerciseId);
      if (!e) continue;
      for (const [g, w] of Object.entries(e.musculos)) {
        cov[g as MuscleGroup] += pe.series * (w ?? 0);
      }
    }
  }
  return cov;
}

export function sumarCobertura(...covs: Coverage[]): Coverage {
  const out = coberturaVacia();
  for (const c of covs) for (const g of GRUPOS) out[g] += c[g] ?? 0;
  return out;
}

export type EstadoCobertura = "corto" | "justo" | "ok" | "alto";

/** corto < mínimo · justo < mínimo+2 · ok hasta 20 · alto por encima (riesgo de exceso). */
export function estadoCobertura(valor: number, minimo: number): EstadoCobertura {
  if (valor + 1e-9 < minimo) return "corto";
  if (valor < minimo + 2) return "justo";
  if (valor <= 22) return "ok";
  return "alto";
}

export function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}
