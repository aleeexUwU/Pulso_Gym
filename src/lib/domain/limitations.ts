import type { Equipment, Exercise, ExerciseTag, LeftHandUse, LimitationId } from "./types";

export interface LimitationDef {
  id: LimitationId;
  nombre: string;
  descripcion: string;
  /** Usos de la mano izquierda que quedan prohibidos. */
  manoIzquierdaProhibida?: LeftHandUse[];
  tagsProhibidos?: ExerciseTag[];
}

export const LIMITACIONES: LimitationDef[] = [
  {
    id: "mano_izquierda",
    nombre: "Mano zamba radial izquierda",
    descripcion:
      "Displasia radial congénita: radio corto o ausente, muñeca desviada, agarre y estabilidad limitados. El tren superior se hace solo con el brazo derecho y nada carga la mano o la muñeca izquierda.",
    manoIzquierdaProhibida: ["agarre", "apoyo_mano"],
  },
  {
    id: "rodilla",
    nombre: "Molestias de rodilla",
    descripcion: "Evita flexiones de rodilla muy profundas y los impactos.",
    tagsProhibidos: ["rodilla_profunda", "impacto"],
  },
  {
    id: "lumbar",
    nombre: "Molestias lumbares",
    descripcion: "Evita ejercicios que cargan la columna (bisagra con peso, Smith sobre la espalda).",
    tagsProhibidos: ["carga_lumbar"],
  },
  {
    id: "hombro_derecho",
    nombre: "Molestias en el hombro derecho",
    descripcion: "Evita empujes y extensiones por encima de la cabeza.",
    tagsProhibidos: ["por_encima_cabeza"],
  },
  {
    id: "equilibrio",
    nombre: "Poco equilibrio",
    descripcion: "Evita ejercicios de pie a una pierna o con carga asimétrica que exijan mucho equilibrio.",
    tagsProhibidos: ["equilibrio"],
  },
];

export const LIMITACIONES_POR_DEFECTO: LimitationId[] = ["mano_izquierda"];

export interface FiltroEjercicios {
  equipo: Equipment[];
  limitaciones: LimitationId[];
  excluidos: string[];
  /** Autoevaluación del brazo izquierdo: si apoyar el antebrazo es cómodo. */
  permiteApoyoAntebrazoIzq?: boolean;
  /** Preferencia (no prohibición): las mancuernas quedan detrás de máquinas y poleas. */
  evitarMancuernas?: boolean;
}

/** Usos de la mano izquierda que nunca se permiten en el módulo gimnasio, haya o no limitación. */
const MANO_IZQ_PROHIBIDA_SIEMPRE_GIMNASIO: LeftHandUse[] = ["agarre", "apoyo_mano"];

export function tieneMaterial(e: Exercise, equipo: Equipment[]): boolean {
  return e.equipo.every((q) => equipo.includes(q));
}

/** ¿Respeta el ejercicio las limitaciones, el material y la lista de ejercicios con dolor? */
export function ejercicioPermitido(e: Exercise, f: FiltroEjercicios): boolean {
  if (e.barraLibre) return false;
  if (f.excluidos.includes(e.id)) return false;
  if (!tieneMaterial(e, f.equipo)) return false;
  if (e.modulo === "gimnasio" && MANO_IZQ_PROHIBIDA_SIEMPRE_GIMNASIO.includes(e.manoIzquierda)) return false;
  if (e.manoIzquierda === "apoyo_antebrazo" && !f.permiteApoyoAntebrazoIzq) return false;
  for (const id of f.limitaciones) {
    const def = LIMITACIONES.find((l) => l.id === id);
    if (!def) continue;
    if (def.manoIzquierdaProhibida?.includes(e.manoIzquierda)) return false;
    if (def.tagsProhibidos?.some((t) => e.tags.includes(t))) return false;
  }
  return true;
}

/** True si el ejercicio necesita la mano izquierda (agarrar o apoyar peso en ella). */
export function requiereManoIzquierda(e: Exercise): boolean {
  return e.manoIzquierda === "agarre" || e.manoIzquierda === "apoyo_mano";
}
