import type { Coverage, Equipment, MuscleGroup } from "./types";

export const GRUPOS: MuscleGroup[] = [
  "pecho",
  "dorsal",
  "espalda_alta",
  "hombro_anterior",
  "hombro_lateral",
  "hombro_posterior",
  "biceps",
  "triceps",
  "antebrazo",
  "cuadriceps",
  "isquios",
  "gluteos",
  "aductores",
  "abductores",
  "gemelos",
  "lumbar",
  "core",
];

export const GRUPO_NOMBRE: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  dorsal: "Dorsal",
  espalda_alta: "Espalda alta / trapecio",
  hombro_anterior: "Hombro anterior",
  hombro_lateral: "Hombro lateral",
  hombro_posterior: "Hombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebrazo: "Antebrazo",
  cuadriceps: "Cuádriceps",
  isquios: "Isquiotibiales",
  gluteos: "Glúteos",
  aductores: "Aductores",
  abductores: "Abductores",
  gemelos: "Gemelos / sóleo",
  lumbar: "Zona lumbar",
  core: "Core",
};

export const TREN_SUPERIOR: MuscleGroup[] = [
  "pecho",
  "dorsal",
  "espalda_alta",
  "hombro_anterior",
  "hombro_lateral",
  "hombro_posterior",
  "biceps",
  "triceps",
  "antebrazo",
];

export const TREN_INFERIOR: MuscleGroup[] = [
  "cuadriceps",
  "isquios",
  "gluteos",
  "aductores",
  "abductores",
  "gemelos",
  "lumbar",
];

/** Grupos que el módulo gimnasio debe cubrir (el core va en casa). */
export const GRUPOS_GIMNASIO: MuscleGroup[] = [...TREN_SUPERIOR, ...TREN_INFERIOR];

/** Grupos grandes: se entrenan directamente en cada sesión que los incluye. */
export const GRUPOS_GRANDES: MuscleGroup[] = ["pecho", "dorsal", "cuadriceps", "isquios", "gluteos"];

export function coberturaVacia(): Coverage {
  return Object.fromEntries(GRUPOS.map((g) => [g, 0])) as Coverage;
}

export const EQUIPO_NOMBRE: Record<Equipment, string> = {
  mancuernas: "Mancuernas",
  banco: "Banco plano",
  banco_inclinable: "Banco inclinable",
  polea: "Poleas (alta y baja)",
  prensa: "Prensa de piernas",
  hack_squat: "Sentadilla hack (máquina)",
  extension_cuadriceps: "Extensión de cuádriceps",
  curl_femoral: "Curl femoral",
  hip_thrust_maquina: "Hip thrust en máquina",
  abductor_maquina: "Máquina de abductores",
  aductor_maquina: "Máquina de aductores",
  gemelo_maquina: "Máquina de gemelos",
  banco_hiperextensiones: "Banco de hiperextensiones",
  press_pecho_maquina: "Press de pecho en máquina",
  press_hombro_maquina: "Press de hombro en máquina",
  contractora: "Contractora (pec deck)",
  remo_maquina: "Remo en máquina",
  jalon_maquina: "Jalón en máquina (palanca)",
  curl_biceps_maquina: "Curl de bíceps en máquina",
  kettlebell: "Kettlebells",
  banda_elastica: "Bandas elásticas",
  cinturon_lastre: "Cinturón de lastre",
  smith: "Máquina Smith (último recurso)",
  barra: "Barra libre y discos",
  barra_dominadas: "Barra de dominadas",
  esterilla: "Esterilla",
};

/** Material de un gimnasio típico (todo menos la Smith, que es último recurso). */
export const EQUIPO_GIMNASIO_COMPLETO: Equipment[] = (Object.keys(EQUIPO_NOMBRE) as Equipment[]).filter(
  (e) => e !== "smith",
);
