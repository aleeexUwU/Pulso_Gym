import { diasEntre, sumarDias } from "./dates";
import { EJERCICIOS_ABDOMINALES, ejercicio } from "./exercises";
import { ejercicioPermitido, type FiltroEjercicios } from "./limitations";
import { coberturaVacia } from "./muscles";
import type { CoreCategory, Coverage, Exercise } from "./types";

export const CATEGORIAS_CORE: CoreCategory[] = ["recto", "oblicuos", "transverso", "lumbar"];

export const CATEGORIA_NOMBRE: Record<CoreCategory, string> = {
  recto: "Recto abdominal",
  oblicuos: "Oblicuos",
  transverso: "Transverso / estabilidad",
  lumbar: "Zona lumbar",
};

export interface AbsItem {
  exerciseId: string;
  categoria: CoreCategory;
  series: number;
  /** Reps o segundos por serie, según `medida`. */
  objetivo: number;
  medida: Exercise["medida"];
  descansoSeg: number;
  /** Nivel dentro de la cadena de progresión (0 = variante base). */
  nivel: number;
}

export interface AbsRoutine {
  fecha: string;
  semana: number;
  items: AbsItem[];
  duracionEstimadaMin: number;
}

/** Variantes "raíz": las que no son la versión difícil de otra. */
function raices(): Exercise[] {
  const destinos = new Set(EJERCICIOS_ABDOMINALES.map((e) => e.siguiente).filter(Boolean));
  return EJERCICIOS_ABDOMINALES.filter((e) => !destinos.has(e.id));
}

/** Semanas que tarda una variante en llegar a su tope (reps o segundos máximos). */
function semanasHastaTope(e: Exercise): number {
  const inc = e.incrementoSemanal ?? 2;
  return Math.ceil((e.repsMax - e.repsMin) / inc);
}

/**
 * Progresión semanal: +reps/+segundos cada semana; al llegar al tope pasa a la
 * variante más difícil (si la hay y está permitida) empezando por su base.
 */
export function resolverProgresion(
  base: Exercise,
  semanas: number,
  permitido: (e: Exercise) => boolean = () => true,
): { ejercicio: Exercise; objetivo: number; nivel: number } {
  let e = base;
  let w = Math.max(0, semanas);
  let nivel = 0;
  for (;;) {
    const tope = semanasHastaTope(e);
    const sig = e.siguiente ? ejercicio(e.siguiente) : undefined;
    if (w <= tope || !sig || !permitido(sig)) {
      const objetivo = Math.min(e.repsMax, e.repsMin + (e.incrementoSemanal ?? 2) * w);
      return { ejercicio: e, objetivo, nivel };
    }
    w -= tope + 1;
    e = sig;
    nivel += 1;
  }
}

function tiempoSerieSeg(item: Pick<AbsItem, "medida" | "objetivo">): number {
  return item.medida === "segundos" ? item.objetivo : item.objetivo * 2.5;
}

/**
 * Rutina de core del día: un ejercicio de cada categoría (recto, oblicuos,
 * transverso, lumbar) más uno extra que rota, variando las variantes cada día.
 */
export function rutinaAbdominales(fecha: string, inicio: string, filtro: FiltroEjercicios): AbsRoutine {
  const d = Math.max(0, diasEntre(inicio, fecha));
  const semana = Math.floor(d / 7);
  const permitido = (e: Exercise) => ejercicioPermitido(e, filtro);
  const disponibles = raices().filter(permitido);
  const series = semana < 2 ? 2 : 3;

  const items: AbsItem[] = [];
  const usados = new Set<string>();
  const anadir = (cat: CoreCategory, desplazamiento: number) => {
    const opciones = disponibles.filter((e) => e.categoriaCore === cat && !usados.has(e.id));
    if (opciones.length === 0) return;
    const base = opciones[(d + desplazamiento) % opciones.length];
    usados.add(base.id);
    const { ejercicio: ej, objetivo, nivel } = resolverProgresion(base, semana, permitido);
    items.push({
      exerciseId: ej.id,
      categoria: cat,
      series,
      objetivo,
      medida: ej.medida,
      descansoSeg: ej.descansoSeg,
      nivel,
    });
  };

  CATEGORIAS_CORE.forEach((cat, i) => anadir(cat, i));
  // Extra rotativo para llegar a 10–15 min y dar más variedad.
  anadir(CATEGORIAS_CORE[d % CATEGORIAS_CORE.length], 1);

  const segundos = () => items.reduce((t, it) => t + it.series * (tiempoSerieSeg(it) + it.descansoSeg) + 20, 0);
  // Mantener la sesión en 10–15 min: primero se acortan descansos y luego se quita el extra.
  if (segundos() > 15 * 60) items.forEach((it) => (it.descansoSeg = 20));
  while (segundos() > 15 * 60 && items.length > CATEGORIAS_CORE.length) items.pop();
  return { fecha, semana, items, duracionEstimadaMin: Math.round(segundos() / 60) };
}

/** Series semanales por grupo que aporta la rutina de casa (para la cobertura del gimnasio). */
export function coberturaAbdominalesSemana(
  desde: string,
  inicio: string,
  filtro: FiltroEjercicios,
  diasPorSemana = 7,
): Coverage {
  const cov = coberturaVacia();
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(desde, i));
  const factor = Math.min(7, Math.max(0, diasPorSemana)) / 7;
  for (const f of fechas) {
    const r = rutinaAbdominales(f, inicio, filtro);
    for (const it of r.items) {
      const e = ejercicio(it.exerciseId);
      for (const [g, w] of Object.entries(e.musculos)) {
        cov[g as keyof Coverage] += it.series * (w ?? 0) * factor;
      }
    }
  }
  return cov;
}

