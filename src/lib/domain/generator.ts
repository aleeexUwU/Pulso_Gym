import { coberturaDeDias, sumarCobertura } from "./coverage";
import { NOMBRE_DIA, ordenarDias } from "./dates";
import { EJERCICIOS_GIMNASIO, ejercicio } from "./exercises";
import { ejercicioPermitido, type FiltroEjercicios } from "./limitations";
import { coberturaVacia, GRUPO_NOMBRE, GRUPOS_GIMNASIO, GRUPOS_GRANDES, TREN_INFERIOR, TREN_SUPERIOR } from "./muscles";
import type {
  Coverage,
  DayFocus,
  Equipment,
  Exercise,
  Experience,
  Goal,
  LimitationId,
  MuscleGroup,
  Plan,
  PlanDay,
  PlannedExercise,
  Weekday,
} from "./types";

export interface GeneratorInput {
  dias: Weekday[];
  duracionMin: number;
  objetivo: Goal;
  experiencia: Experience;
  equipo: Equipment[];
  limitaciones: LimitationId[];
  excluidos: string[];
  seriesMinimas: number;
  /** Series que ya aporta el módulo de abdominales en casa (cuenta para la cobertura). */
  coberturaCasa?: Coverage;
  /** Agrupar aislamientos de torso y pierna en biseries para acortar la sesión. */
  biseries?: boolean;
  id?: string;
  creadoEn?: string;
}

export const MAX_SERIES_EJERCICIO = 4;
const SERIES_INICIALES = 2;

interface Item {
  ex: Exercise;
  series: number;
  ultimoRecurso: boolean;
}

interface Sesion {
  diaSemana: Weekday;
  enfoque: DayFocus;
  items: Item[];
}

export function filtroDe(input: Pick<GeneratorInput, "equipo" | "limitaciones" | "excluidos">): FiltroEjercicios {
  return { equipo: input.equipo, limitaciones: input.limitaciones, excluidos: input.excluidos };
}

/**
 * Ejercicios válidos para un grupo como músculo principal. La Smith solo entra
 * si no hay NINGUNA alternativa con el material configurado (último recurso).
 */
export function candidatos(grupo: MuscleGroup, filtro: FiltroEjercicios): { lista: Exercise[]; ultimoRecurso: boolean } {
  const validos = EJERCICIOS_GIMNASIO.filter((e) => (e.musculos[grupo] ?? 0) >= 1 && ejercicioPermitido(e, filtro));
  const orden = (a: Exercise, b: Exercise) => a.prioridad - b.prioridad || Number(b.compuesto) - Number(a.compuesto);
  const sinSmith = validos.filter((e) => !e.smith).sort(orden);
  if (sinSmith.length > 0) return { lista: sinSmith, ultimoRecurso: false };
  return { lista: validos.filter((e) => e.smith).sort(orden), ultimoRecurso: true };
}

/** Reparto de la semana según el número de días. */
export function enfoquesPara(n: number): DayFocus[] {
  if (n <= 3) return Array.from({ length: n }, () => "completo");
  const tp: DayFocus[] = [];
  for (let i = 0; i < Math.min(n, 6); i++) tp.push(i % 2 === 0 ? "torso" : "pierna");
  if (n === 5) tp[4] = "completo";
  if (n >= 7) tp.push("completo");
  return tp;
}

export function gruposDe(enfoque: DayFocus): MuscleGroup[] {
  if (enfoque === "torso") return TREN_SUPERIOR;
  if (enfoque === "pierna") return TREN_INFERIOR;
  return GRUPOS_GIMNASIO;
}

const NOMBRE_ENFOQUE: Record<DayFocus, string> = {
  completo: "Cuerpo completo",
  torso: "Torso (brazo derecho)",
  pierna: "Pierna y lumbar",
};

/** Series, reps, descanso y RIR según objetivo y experiencia. */
export function prescripcion(
  e: Exercise,
  objetivo: Goal,
  experiencia: Experience,
): Pick<PlannedExercise, "repsMin" | "repsMax" | "descansoSeg" | "rir"> {
  let { repsMin, repsMax, descansoSeg } = e;
  if (e.medida === "reps") {
    if (objetivo === "fuerza" && e.compuesto) {
      repsMin = Math.max(5, repsMin - 3);
      repsMax = Math.max(repsMin + 2, repsMax - 4);
      descansoSeg += 30;
    } else if (objetivo === "salud") {
      repsMin += 2;
      repsMax += 3;
      descansoSeg = Math.max(45, descansoSeg - 15);
    }
  }
  let rir = experiencia === "principiante" ? 3 : experiencia === "intermedio" ? 2 : 1;
  if (objetivo === "salud") rir = Math.min(4, rir + 1);
  return { repsMin, repsMax, descansoSeg, rir };
}

/** Segundos de trabajo de una serie (≈3,5 s por repetición). */
function trabajoSerie(pe: PlannedExercise): number {
  return ejercicio(pe.exerciseId).medida === "segundos" ? pe.repsMax : pe.repsMax * 3.5;
}

/**
 * Duración estimada (min): preparación + series × (trabajo + descanso).
 * En una biserie se descansa una sola vez por ronda (15 s para cambiar de ejercicio).
 */
export function duracionEstimada(ejercicios: PlannedExercise[]): number {
  let seg = 0;
  const vistas = new Set<string>();
  for (const pe of ejercicios) {
    if (pe.biserie) {
      if (vistas.has(pe.biserie)) continue;
      vistas.add(pe.biserie);
      const par = ejercicios.filter((x) => x.biserie === pe.biserie);
      const rondas = Math.max(...par.map((x) => x.series));
      const trabajo = par.reduce((t, x) => t + trabajoSerie(x), 0) + 15 * (par.length - 1);
      const descanso = Math.max(...par.map((x) => x.descansoSeg));
      seg += 60 * par.length + rondas * (trabajo + descanso);
      continue;
    }
    seg += 60 + pe.series * (trabajoSerie(pe) + pe.descansoSeg);
  }
  return Math.round(seg / 60);
}

function cobertura(sesiones: Sesion[], extra: Coverage): Coverage {
  const dias = sesiones.map((s) => ({
    ejercicios: s.items.map((it) => ({ exerciseId: it.ex.id, series: it.series }) as PlannedExercise),
  }));
  return sumarCobertura(coberturaDeDias(dias), extra);
}

function minutosSesion(s: Sesion): number {
  let seg = 0;
  for (const it of s.items) {
    const trabajo = it.ex.medida === "segundos" ? it.ex.repsMax : it.ex.repsMax * 3.5;
    seg += 60 + it.series * (trabajo + it.ex.descansoSeg);
  }
  return seg / 60;
}

function tieneDirecto(s: Sesion, g: MuscleGroup): boolean {
  return s.items.some((it) => (it.ex.musculos[g] ?? 0) >= 1);
}

/** Elige un candidato que no esté ya en la sesión, rotando para variar entre días. */
function elegir(lista: Exercise[], sesion: Sesion, rotacion: number): Exercise | undefined {
  const libres = lista.filter((e) => !sesion.items.some((it) => it.ex.id === e.id));
  if (libres.length === 0) return undefined;
  return libres[rotacion % libres.length];
}

/**
 * Rellena volumen de forma voraz hasta que todos los grupos llegan al mínimo:
 * en cada paso elige la acción (subir una serie o añadir un ejercicio) que más
 * déficit reduce por serie, penalizando las sesiones ya cargadas.
 */
function completarCobertura(sesiones: Sesion[], input: GeneratorInput, filtro: FiltroEjercicios): MuscleGroup[] {
  const extra = input.coberturaCasa ?? coberturaVacia();
  const cand = new Map(GRUPOS_GIMNASIO.map((g) => [g, candidatos(g, filtro)]));

  for (let paso = 0; paso < 600; paso++) {
    const cov = cobertura(sesiones, extra);
    const deficit = new Map<MuscleGroup, number>();
    for (const g of GRUPOS_GIMNASIO) {
      const d = input.seriesMinimas - cov[g];
      if (d > 1e-9) deficit.set(g, d);
    }
    if (deficit.size === 0) return [];

    const ganancia = (e: Exercise, series: number) => {
      let total = 0;
      for (const [g, d] of deficit) total += Math.min(d, series * (e.musculos[g] ?? 0));
      return total;
    };
    // Penaliza las sesiones más largas para repartir el volumen entre días.
    const carga = (s: Sesion) => 1 + minutosSesion(s) / 60;

    let mejor: { puntuacion: number; aplicar: () => void } | null = null;
    const proponer = (puntuacion: number, aplicar: () => void) => {
      if (puntuacion > 1e-9 && (!mejor || puntuacion > mejor.puntuacion + 1e-9)) mejor = { puntuacion, aplicar };
    };

    sesiones.forEach((s) => {
      for (const it of s.items) {
        if (it.series >= MAX_SERIES_EJERCICIO) continue;
        proponer(ganancia(it.ex, 1) / carga(s), () => {
          it.series += 1;
        });
      }
    });

    for (const g of deficit.keys()) {
      const c = cand.get(g)!;
      if (c.lista.length === 0) continue;
      sesiones.forEach((s) => {
        if (!gruposDe(s.enfoque).includes(g)) return;
        const e = elegir(c.lista, s, 0);
        if (!e) return;
        proponer(ganancia(e, SERIES_INICIALES) / ((SERIES_INICIALES + 0.75) * carga(s)), () => {
          s.items.push({ ex: e, series: SERIES_INICIALES, ultimoRecurso: c.ultimoRecurso });
        });
      });
    }

    if (!mejor) return [...deficit.keys()];
    (mejor as { aplicar: () => void }).aplicar();
  }
  const cov = cobertura(sesiones, extra);
  return GRUPOS_GIMNASIO.filter((g) => cov[g] + 1e-9 < input.seriesMinimas);
}

/**
 * Compuestos primero (pierna antes que torso) y aislamientos alternando torso/pierna.
 * Con biseries, cada aislamiento de torso se empareja con el de pierna que le sigue.
 */
function ordenar(items: Item[], biseries: boolean): { item: Item; biserie?: string }[] {
  const esPierna = (e: Exercise) =>
    Object.entries(e.musculos).some(([g, w]) => (w ?? 0) >= 1 && TREN_INFERIOR.includes(g as MuscleGroup));
  const porPrioridad = (a: Item, b: Item) => a.ex.prioridad - b.ex.prioridad || b.series - a.series;
  const compuestos = items
    .filter((it) => it.ex.compuesto)
    .sort((a, b) => Number(esPierna(b.ex)) - Number(esPierna(a.ex)) || porPrioridad(a, b));
  const aislPierna = items.filter((it) => !it.ex.compuesto && esPierna(it.ex)).sort(porPrioridad);
  const aislTorso = items.filter((it) => !it.ex.compuesto && !esPierna(it.ex)).sort(porPrioridad);
  const out: { item: Item; biserie?: string }[] = compuestos.map((item) => ({ item }));
  let n = 0;
  while (aislPierna.length || aislTorso.length) {
    const t = aislTorso.shift();
    const p = aislPierna.shift();
    if (t && p && biseries) {
      n += 1;
      out.push({ item: t, biserie: `B${n}` }, { item: p, biserie: `B${n}` });
    } else {
      if (t) out.push({ item: t });
      if (p) out.push({ item: p });
    }
  }
  return out;
}

function aPlanDay(s: Sesion, i: number, input: GeneratorInput): PlanDay {
  const ejercicios: PlannedExercise[] = ordenar(s.items, input.biseries ?? true).map(({ item: it, biserie }) => ({
    exerciseId: it.ex.id,
    series: it.series,
    ...prescripcion(it.ex, input.objetivo, input.experiencia),
    ...(biserie ? { biserie } : {}),
    ...(it.ultimoRecurso || it.ex.smith
      ? { ultimoRecurso: true, alternativaPreferida: it.ex.alternativaPreferida }
      : {}),
  }));
  return {
    id: `dia-${s.diaSemana}`,
    diaSemana: s.diaSemana,
    nombre: `Día ${String.fromCharCode(65 + i)} · ${NOMBRE_ENFOQUE[s.enfoque]}`,
    enfoque: s.enfoque,
    ejercicios,
    duracionEstimadaMin: duracionEstimada(ejercicios),
  };
}

export function avisosPlan(
  dias: PlanDay[],
  sinCubrir: MuscleGroup[],
  input: Pick<GeneratorInput, "duracionMin" | "seriesMinimas">,
): string[] {
  const avisos: string[] = [];
  for (const d of dias) {
    if (d.duracionEstimadaMin > input.duracionMin + 10) {
      avisos.push(
        `${NOMBRE_DIA[d.diaSemana]}: la sesión dura ~${d.duracionEstimadaMin} min (configuraste ${input.duracionMin}). Para acortarla: añade un día, baja el mínimo de series semanales (ahora ${input.seriesMinimas}) o acepta sesiones más largas.`,
      );
    }
    for (const pe of d.ejercicios) {
      if (pe.ultimoRecurso) {
        const e = ejercicio(pe.exerciseId);
        const pref = pe.alternativaPreferida ? ejercicio(pe.alternativaPreferida).nombre : "otra opción";
        avisos.push(
          `${e.nombre}: último recurso porque no hay alternativa con tu material. Preferible: ${pref}.`,
        );
      }
    }
  }
  if (sinCubrir.length) {
    avisos.push(
      `Sin volumen suficiente con tu material o limitaciones: ${sinCubrir.map((g) => GRUPO_NOMBRE[g]).join(", ")}. Revisa el material disponible en Ajustes.`,
    );
  }
  return [...new Set(avisos)];
}

function construirPlan(sesiones: Sesion[], sinCubrir: MuscleGroup[], input: GeneratorInput): Plan {
  const dias = sesiones.map((s, i) => aPlanDay(s, i, input));
  const casa = input.coberturaCasa ?? coberturaVacia();
  return {
    id: input.id ?? `plan-${Date.now()}`,
    creadoEn: input.creadoEn ?? new Date().toISOString(),
    dias,
    cobertura: sumarCobertura(coberturaDeDias(dias), casa),
    seriesMinimas: input.seriesMinimas,
    avisos: avisosPlan(dias, sinCubrir, input),
    gruposSinCubrir: sinCubrir,
  };
}

/**
 * Generador determinista de rutinas.
 * 1) Reparte los días (cuerpo completo con 2–3 días; torso/pierna con 4 o más).
 * 2) Cada sesión trabaja directamente los grupos grandes que le tocan y cada grupo
 *    pequeño tiene al menos un ejercicio directo a la semana.
 * 3) Completa volumen hasta el mínimo de series efectivas por grupo.
 */
export function generarPlan(input: GeneratorInput): Plan {
  const filtro = filtroDe(input);
  const diasOrdenados = ordenarDias(input.dias.length ? input.dias : [6, 0]);
  const enfoques = enfoquesPara(diasOrdenados.length);
  const sesiones: Sesion[] = diasOrdenados.map((d, i) => ({ diaSemana: d, enfoque: enfoques[i], items: [] }));
  const cand = new Map(GRUPOS_GIMNASIO.map((g) => [g, candidatos(g, filtro)]));

  // Grupos grandes en cada sesión que los incluye (mientras les falte volumen), rotando variantes.
  const extra = input.coberturaCasa ?? coberturaVacia();
  const vecesGrupo = new Map<MuscleGroup, number>();
  for (const s of sesiones) {
    for (const g of GRUPOS_GRANDES) {
      if (!gruposDe(s.enfoque).includes(g) || tieneDirecto(s, g)) continue;
      if (cobertura(sesiones, extra)[g] >= input.seriesMinimas) continue;
      const c = cand.get(g)!;
      const k = vecesGrupo.get(g) ?? 0;
      const e = elegir(c.lista, s, k);
      if (!e) continue;
      s.items.push({ ex: e, series: SERIES_INICIALES, ultimoRecurso: c.ultimoRecurso });
      vecesGrupo.set(g, k + 1);
    }
  }

  // Cada grupo, al menos un ejercicio directo a la semana (repartidos entre sesiones).
  GRUPOS_GIMNASIO.forEach((g, idx) => {
    const posibles = sesiones.filter((s) => gruposDe(s.enfoque).includes(g));
    if (posibles.length === 0 || posibles.some((s) => tieneDirecto(s, g))) return;
    const s = posibles[idx % posibles.length];
    const c = cand.get(g)!;
    const e = elegir(c.lista, s, 0);
    if (e) s.items.push({ ex: e, series: SERIES_INICIALES, ultimoRecurso: c.ultimoRecurso });
  });

  const sinCubrir = completarCobertura(sesiones, input, filtro);
  return construirPlan(sesiones, sinCubrir, input);
}

/** Vuelve a completar la cobertura de un plan ya editado (tras sustituir un ejercicio). */
export function repararPlan(plan: Plan, input: GeneratorInput): Plan {
  const filtro = filtroDe(input);
  const sesiones: Sesion[] = plan.dias.map((d) => ({
    diaSemana: d.diaSemana,
    enfoque: d.enfoque,
    items: d.ejercicios.map((pe) => ({
      ex: ejercicio(pe.exerciseId),
      series: pe.series,
      ultimoRecurso: !!pe.ultimoRecurso,
    })),
  }));
  const sinCubrir = completarCobertura(sesiones, input, filtro);
  return construirPlan(sesiones, sinCubrir, { ...input, id: plan.id, creadoEn: plan.creadoEn });
}
