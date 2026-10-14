import { diasEntre } from "./dates";
import type { Exercise, Experience, LoadType, Profile, Settings } from "./types";

export interface SetLog {
  pesoKg: number | null;
  reps: number | null;
  rir?: number | null;
  hecho: boolean;
}

/** Registro de un ejercicio en una sesión (lo que la progresión necesita saber). */
export interface ExerciseLog {
  fecha: string;
  exerciseId: string;
  repsMin: number;
  repsMax: number;
  series: SetLog[];
  buenaTecnica: boolean;
  descarga?: boolean;
}

export type EstadoProgresion = "calibracion" | "subir" | "mantener" | "bajar" | "descarga";

export interface Sugerencia {
  estado: EstadoProgresion;
  pesoKg: number | null;
  repsObjetivo: number;
  mensaje: string;
}

export type Incrementos = Settings["incrementos"];

export const INCREMENTOS_POR_DEFECTO: Incrementos = {
  mancuerna: 2,
  maquina: 5,
  polea: 2.5,
  kettlebell: 4,
  smith: 2.5,
};

export function incrementoPara(tipo: LoadType, inc: Incrementos): number {
  switch (tipo) {
    case "mancuerna":
      return inc.mancuerna;
    case "maquina":
      return inc.maquina;
    case "polea":
      return inc.polea;
    case "kettlebell":
      return inc.kettlebell;
    case "barra":
      return inc.smith;
    case "smith":
      return inc.smith;
    default:
      return 0;
  }
}

export function redondearPeso(kg: number): number {
  return Math.max(0, Math.round(kg * 2) / 2);
}

/** Peso de partida muy conservador para la calibración (semana 1). */
export function pesoInicial(e: Exercise, perfil: Pick<Profile, "pesoKg" | "sexo" | "experiencia">): number | null {
  if (e.cargaInicial == null) return null;
  const pc = perfil.pesoKg ?? 75;
  let f = Math.min(1.3, Math.max(0.7, pc / 75));
  if (perfil.sexo === "mujer") f *= 0.65;
  const exp: Record<Experience, number> = { principiante: 0.8, intermedio: 1, avanzado: 1.2 };
  f *= exp[perfil.experiencia];
  return redondearPeso(e.cargaInicial * f);
}

const seriesHechas = (l: ExerciseLog) => l.series.filter((s) => s.hecho && s.reps != null);

/** Peso de trabajo de una sesión: el máximo usado en series completadas. */
export function pesoTrabajo(l: ExerciseLog): number | null {
  const pesos = seriesHechas(l)
    .map((s) => s.pesoKg)
    .filter((p): p is number => p != null);
  return pesos.length ? Math.max(...pesos) : null;
}

/**
 * La calibración termina cuando hay una serie dentro del rango con 1–4 reps en
 * reserva (o sin RIR anotado). Devuelve el peso de partida o null si aún no.
 */
export function pesoCalibrado(l: ExerciseLog): number | null {
  const validas = seriesHechas(l).filter(
    (s) => s.reps! >= l.repsMin && s.reps! <= l.repsMax + 2 && (s.rir == null || (s.rir >= 1 && s.rir <= 4)),
  );
  if (validas.length === 0) return null;
  // Preferimos las series con 2–3 RIR, que es lo que pide la calibración.
  const ideales = validas.filter((s) => s.rir != null && s.rir >= 2 && s.rir <= 3);
  const base = ideales.length ? ideales : validas;
  const pesos = base.map((s) => s.pesoKg ?? 0);
  return Math.max(...pesos);
}

/** e1RM de Epley para comparar rendimiento entre sesiones. */
export function e1rm(peso: number, reps: number): number {
  return peso * (1 + reps / 30);
}

export function mejorE1rm(l: ExerciseLog): number {
  let best = 0;
  for (const s of seriesHechas(l)) {
    if (s.pesoKg != null && s.pesoKg > 0) best = Math.max(best, e1rm(s.pesoKg, s.reps!));
  }
  return best;
}

/**
 * Peso y reps sugeridos para la próxima sesión de un ejercicio.
 * - Sin historial (o calibración sin cerrar): calibración guiada.
 * - Doble progresión: todas las series al tope del rango con buena técnica → subir.
 * - Dos sesiones seguidas sin llegar al mínimo → bajar; una → mantener.
 */
export function sugerirCarga(
  e: Exercise,
  rango: { repsMin: number; repsMax: number },
  historial: ExerciseLog[],
  inc: Incrementos,
  perfil: Pick<Profile, "pesoKg" | "sexo" | "experiencia">,
): Sugerencia {
  const paso = incrementoPara(e.tipoCarga, inc);
  const logs = historial
    .filter((l) => l.exerciseId === e.id && !l.descarga && seriesHechas(l).length > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const sinCarga = e.cargaInicial == null;

  if (sinCarga) {
    // Peso corporal o banda: progresión por repeticiones.
    const ultimo = logs.at(-1);
    if (!ultimo) {
      return { estado: "calibracion", pesoKg: null, repsObjetivo: rango.repsMin, mensaje: "Primera vez: céntrate en la técnica." };
    }
    const reps = seriesHechas(ultimo).map((s) => s.reps!);
    const todasTope = reps.length > 0 && reps.every((r) => r >= rango.repsMax);
    if (todasTope && ultimo.buenaTecnica) {
      return {
        estado: "subir",
        pesoKg: null,
        repsObjetivo: rango.repsMax,
        mensaje: "Llegaste al tope: añade carga (banda más dura, mancuerna o lastre) o una pausa de 2 s por repetición.",
      };
    }
    return {
      estado: "mantener",
      pesoKg: null,
      repsObjetivo: Math.min(rango.repsMax, Math.max(...reps) + 1),
      mensaje: "Intenta sumar una repetición por serie.",
    };
  }

  // ¿Hay ya un peso calibrado?
  let calibrado: number | null = null;
  for (const l of logs) {
    const c = pesoCalibrado(l);
    if (c != null) {
      calibrado = c;
      break;
    }
  }

  if (calibrado == null) {
    const ultimo = logs.at(-1);
    const inicial = pesoInicial(e, perfil) ?? 0;
    if (!ultimo) {
      return {
        estado: "calibracion",
        pesoKg: inicial,
        repsObjetivo: rango.repsMin,
        mensaje: `Calibración: empieza con ${inicial} kg y sube serie a serie hasta un peso con el que te queden 2–3 repeticiones en reserva haciendo ${rango.repsMin}–${rango.repsMax}.`,
      };
    }
    const hechas = seriesHechas(ultimo);
    const pesoUlt = pesoTrabajo(ultimo) ?? inicial;
    const demasiadoLigero = hechas.every((s) => s.reps! > rango.repsMax || (s.rir != null && s.rir > 4));
    const nuevo = redondearPeso(demasiadoLigero ? pesoUlt + paso * 2 : Math.max(0, pesoUlt - paso));
    return {
      estado: "calibracion",
      pesoKg: nuevo,
      repsObjetivo: rango.repsMin,
      mensaje: demasiadoLigero
        ? "Sigue la calibración: el último peso fue ligero, empieza más arriba."
        : "Sigue la calibración: el último peso fue demasiado; empieza algo más ligero.",
    };
  }

  const ultimo = logs.at(-1)!;
  const W = pesoTrabajo(ultimo) ?? calibrado;
  const hechas = seriesHechas(ultimo).filter((s) => (s.pesoKg ?? 0) >= W);
  const todasTope = hechas.length > 0 && hechas.every((s) => s.reps! >= rango.repsMax);
  if (todasTope && ultimo.buenaTecnica) {
    const nuevo = redondearPeso(W + paso);
    return {
      estado: "subir",
      pesoKg: nuevo,
      repsObjetivo: rango.repsMin,
      mensaje: `¡Tope del rango en todas las series! Sube a ${nuevo} kg y vuelve a ${rango.repsMin} reps.`,
    };
  }

  const falloMinimo = (l: ExerciseLog) => {
    const w = pesoTrabajo(l);
    return seriesHechas(l).some((s) => (s.pesoKg ?? 0) >= (w ?? 0) && s.reps! < rango.repsMin);
  };
  const ultimos2 = logs.slice(-2);
  if (ultimos2.length === 2 && ultimos2.every(falloMinimo)) {
    const nuevo = redondearPeso(W - paso);
    return {
      estado: "bajar",
      pesoKg: nuevo,
      repsObjetivo: rango.repsMin,
      mensaje: `Dos sesiones sin llegar a ${rango.repsMin} reps: baja a ${nuevo} kg y reconstruye.`,
    };
  }

  const mejores = hechas.map((s) => s.reps!);
  const objetivo = Math.min(rango.repsMax, (mejores.length ? Math.min(...mejores) : rango.repsMin) + 1);
  return {
    estado: "mantener",
    pesoKg: W,
    repsObjetivo: Math.max(rango.repsMin, objetivo),
    mensaje: falloMinimo(ultimo)
      ? "La última vez no llegaste al mínimo: mantén el peso y céntrate en la técnica."
      : `Mantén ${W} kg e intenta sumar repeticiones hasta ${rango.repsMax}.`,
  };
}

export interface EvaluacionDescarga {
  sugerir: boolean;
  motivo: string | null;
}

/**
 * Descarga cada N semanas (6–8) o antes si cae el rendimiento: 3 o más ejercicios
 * con el mejor e1RM de su última sesión >5 % por debajo de su mejor marca reciente.
 */
export function evaluarDescarga(
  hoy: string,
  settings: Pick<Settings, "inicioPrograma" | "ultimaDescarga" | "semanasDescarga" | "descargaHasta">,
  historial: ExerciseLog[],
): EvaluacionDescarga {
  if (settings.descargaHasta && settings.descargaHasta >= hoy) return { sugerir: false, motivo: null };
  const desde = settings.ultimaDescarga ?? settings.inicioPrograma;
  const semanas = Math.floor(diasEntre(desde, hoy) / 7);
  if (semanas >= settings.semanasDescarga) {
    return {
      sugerir: true,
      motivo: `Llevas ${semanas} semanas entrenando sin descarga. Toca una semana suave para recuperar.`,
    };
  }

  const porEjercicio = new Map<string, ExerciseLog[]>();
  for (const l of historial) {
    if (l.descarga) continue;
    const arr = porEjercicio.get(l.exerciseId) ?? [];
    arr.push(l);
    porEjercicio.set(l.exerciseId, arr);
  }
  let caidas = 0;
  for (const logs of porEjercicio.values()) {
    if (logs.length < 3) continue;
    logs.sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ultimo = mejorE1rm(logs.at(-1)!);
    const previos = Math.max(...logs.slice(-4, -1).map(mejorE1rm));
    if (previos > 0 && ultimo < previos * 0.95) caidas += 1;
  }
  if (caidas >= 3) {
    return {
      sugerir: true,
      motivo: `El rendimiento ha bajado en ${caidas} ejercicios. Una semana de descarga suele arreglarlo.`,
    };
  }
  return { sugerir: false, motivo: null };
}

/** Prescripción en semana de descarga: mitad de series, 90 % del peso y +1 RIR. */
export function aplicarDescarga<T extends { series: number; rir: number }>(pe: T): T {
  return { ...pe, series: Math.max(1, Math.round(pe.series / 2)), rir: pe.rir + 1 };
}

export function pesoDescarga(peso: number | null): number | null {
  return peso == null ? null : redondearPeso(peso * 0.9);
}

/**
 * Rampa de entrada para quien retoma: en las 2 primeras semanas se quita una
 * serie a los ejercicios de 3 o más series.
 */
export function aplicarRampa<T extends { series: number }>(pe: T, semanaPrograma: number): T {
  if (semanaPrograma >= 2 || pe.series < 3) return pe;
  return { ...pe, series: pe.series - 1 };
}
