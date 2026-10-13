import type { ArmSession, Workout } from "@/lib/db/types";
import { inicioSemana, sumarDias } from "@/lib/domain/dates";
import { getEjercicio } from "@/lib/domain/exercises";
import { coberturaVacia } from "@/lib/domain/muscles";
import { e1rm } from "@/lib/domain/progression";
import type { Coverage, MuscleGroup } from "@/lib/domain/types";

const completados = (ws: Workout[]) => ws.filter((w) => w.estado === "completado");

/** Evolución de un ejercicio: peso máximo y 1RM estimado por sesión. */
export function serieEjercicio(ws: Workout[], exerciseId: string) {
  const out: { fecha: string; peso: number; e1rm: number; reps: number }[] = [];
  for (const w of completados(ws)) {
    const ej = w.ejercicios.find((e) => e.exerciseId === exerciseId);
    if (!ej) continue;
    const hechas = ej.series.filter((s) => s.hecho && s.reps != null);
    if (!hechas.length) continue;
    const peso = Math.max(...hechas.map((s) => s.pesoKg ?? 0));
    const best = Math.max(...hechas.map((s) => e1rm(s.pesoKg ?? 0, s.reps!)));
    const reps = Math.max(...hechas.map((s) => s.reps!));
    out.push({ fecha: w.fecha, peso, e1rm: Math.round(best * 10) / 10, reps });
  }
  return out;
}

export function ejerciciosRegistrados(ws: Workout[]): string[] {
  const ids = new Set<string>();
  for (const w of completados(ws)) for (const e of w.ejercicios) if (e.series.some((s) => s.hecho)) ids.add(e.exerciseId);
  return [...ids];
}

/** Series efectivas HECHAS por grupo en la semana que empieza el lunes `desde`. */
export function volumenSemana(ws: Workout[], desde: string): Coverage {
  const cov = coberturaVacia();
  const hasta = sumarDias(desde, 7);
  for (const w of ws) {
    if (w.fecha < desde || w.fecha >= hasta) continue;
    for (const e of w.ejercicios) {
      const ex = getEjercicio(e.exerciseId);
      if (!ex) continue;
      const n = e.series.filter((s) => s.hecho).length;
      for (const [g, p] of Object.entries(ex.musculos)) cov[g as MuscleGroup] += n * (p ?? 0);
    }
  }
  return cov;
}

/** Récords: mejor peso y mejor 1RM estimado por ejercicio. */
export function records(ws: Workout[]) {
  const map = new Map<string, { exerciseId: string; peso: number; e1rm: number; fecha: string }>();
  for (const w of completados(ws))
    for (const e of w.ejercicios)
      for (const s of e.series) {
        if (!s.hecho || s.reps == null || !s.pesoKg) continue;
        const r = e1rm(s.pesoKg, s.reps);
        const prev = map.get(e.exerciseId);
        if (!prev || r > prev.e1rm)
          map.set(e.exerciseId, { exerciseId: e.exerciseId, peso: Math.max(prev?.peso ?? 0, s.pesoKg), e1rm: Math.round(r * 10) / 10, fecha: w.fecha });
        else if (s.pesoKg > prev.peso) prev.peso = s.pesoKg;
      }
  return [...map.values()].sort((a, b) => b.e1rm - a.e1rm);
}

/** Asistencia de las últimas N semanas: sesiones de gimnasio y días de core. */
export function asistencia(hoy: string, semanas: number, fechasGym: string[], fechasAbs: string[], fechasBrazo: string[]) {
  const lunes = inicioSemana(hoy);
  return Array.from({ length: semanas }, (_, i) => {
    const desde = sumarDias(lunes, -7 * (semanas - 1 - i));
    const hasta = sumarDias(desde, 7);
    const en = (f: string[]) => new Set(f.filter((x) => x >= desde && x < hasta)).size;
    return { semana: desde, gimnasio: en(fechasGym), core: en(fechasAbs), brazo: en(fechasBrazo) };
  });
}

export function evolucionBrazo(ss: ArmSession[]) {
  return ss
    .filter((s) => s.completado)
    .map((s) => ({
      fecha: s.fecha,
      antes: s.dolorAntes,
      despues: s.dolorDespues ?? s.dolorAntes,
      volumen: s.entradas.reduce((t, e) => t + e.series.filter((x) => x.hecho).reduce((a, x) => a + (x.valor ?? 0), 0), 0),
    }));
}
