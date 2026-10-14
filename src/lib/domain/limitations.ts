import type { Equipment, Exercise, ExerciseTag, LeftHandUse, LimitationId } from "./types";

export interface LimitationDef {
  id: LimitationId;
  nombre: string;
  descripcion: string;
  /** Usos de la mano izquierda que quedan prohibidos. */
  manoIzquierdaProhibida?: LeftHandUse[];
  /** Sin barra libre (exige las dos manos). */
  prohibeBarraLibre?: boolean;
  tagsProhibidos?: ExerciseTag[];
  /** Palabras que, si aparecen en lo que escribe el usuario, sugieren esta limitación. */
  palabrasClave: string[];
}

/**
 * Limitaciones físicas que la app sabe adaptar. Ninguna viene marcada: cada persona
 * marca las suyas (o las describe con sus palabras) al personalizar la rutina.
 */
export const LIMITACIONES: LimitationDef[] = [
  {
    id: "mano_izquierda",
    nombre: "Mano o brazo izquierdo limitado",
    descripcion:
      "No puedes agarrar ni apoyar peso con la mano izquierda (lesión, malformación, falta de fuerza o movilidad…). El tren superior se hace con el brazo derecho y nada carga la mano o la muñeca izquierda.",
    manoIzquierdaProhibida: ["agarre", "apoyo_mano"],
    prohibeBarraLibre: true,
    palabrasClave: ["mano izquierda", "brazo izquierdo", "muneca izquierda", "zamba", "manco", "amput", "un solo brazo", "una sola mano", "una mano"],
  },
  {
    id: "rodilla",
    nombre: "Molestias de rodilla",
    descripcion: "Evita flexiones de rodilla muy profundas y los impactos.",
    tagsProhibidos: ["rodilla_profunda", "impacto"],
    palabrasClave: ["rodilla", "menisco", "ligamento cruzado", "rotula", "condromalacia"],
  },
  {
    id: "lumbar",
    nombre: "Molestias lumbares",
    descripcion: "Evita ejercicios que cargan la columna (bisagra con peso, barra o Smith sobre la espalda).",
    tagsProhibidos: ["carga_lumbar"],
    palabrasClave: ["lumbar", "espalda baja", "hernia", "ciatica", "lumbago", "disco"],
  },
  {
    id: "hombro_derecho",
    nombre: "Molestias de hombro",
    descripcion: "Evita empujes y extensiones por encima de la cabeza.",
    tagsProhibidos: ["por_encima_cabeza"],
    palabrasClave: ["hombro", "manguito", "supraespinoso", "tendinitis de hombro", "luxacion"],
  },
  {
    id: "equilibrio",
    nombre: "Poco equilibrio",
    descripcion: "Evita ejercicios de pie a una pierna o con carga asimétrica que exijan mucho equilibrio.",
    tagsProhibidos: ["equilibrio"],
    palabrasClave: ["equilibrio", "mareo", "vertigo", "estabilidad"],
  },
];

export const LIMITACIONES_POR_DEFECTO: LimitationId[] = [];

/** ¿Tiene esta persona una mano limitada? (cambia textos, catálogo y módulo de brazo). */
export function tieneManoLimitada(limitaciones: readonly LimitationId[]): boolean {
  return limitaciones.includes("mano_izquierda");
}

const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Sugerencias a partir de lo que la persona escribe sobre sus lesiones (sin IA). */
export function detectarLimitaciones(texto: string): LimitationId[] {
  const t = sinTildes(texto);
  if (!t.trim()) return [];
  return LIMITACIONES.filter((l) => l.palabrasClave.some((p) => t.includes(p))).map((l) => l.id);
}

export interface FiltroEjercicios {
  equipo: Equipment[];
  limitaciones: LimitationId[];
  excluidos: string[];
  /** Autoevaluación del brazo izquierdo: si apoyar el antebrazo es cómodo. */
  permiteApoyoAntebrazoIzq?: boolean;
  /** Preferencia (no prohibición): las mancuernas quedan detrás de máquinas y poleas. */
  evitarMancuernas?: boolean;
}

export function tieneMaterial(e: Exercise, equipo: Equipment[]): boolean {
  return e.equipo.every((q) => equipo.includes(q));
}

/** ¿Respeta el ejercicio las limitaciones, el material y la lista de ejercicios excluidos? */
export function ejercicioPermitido(e: Exercise, f: FiltroEjercicios): boolean {
  if (f.excluidos.includes(e.id)) return false;
  if (!tieneMaterial(e, f.equipo)) return false;
  if (e.manoIzquierda === "apoyo_antebrazo" && f.permiteApoyoAntebrazoIzq === false) return false;
  for (const id of f.limitaciones) {
    const def = LIMITACIONES.find((l) => l.id === id);
    if (!def) continue;
    if (def.manoIzquierdaProhibida?.includes(e.manoIzquierda)) return false;
    if (def.prohibeBarraLibre && e.barraLibre) return false;
    if (def.tagsProhibidos?.some((t) => e.tags.includes(t))) return false;
  }
  return true;
}

/** True si el ejercicio necesita la mano izquierda (agarrar o apoyar peso en ella). */
export function requiereManoIzquierda(e: Exercise): boolean {
  return e.manoIzquierda === "agarre" || e.manoIzquierda === "apoyo_mano";
}
