import type { EstadoProgresion } from "@/lib/domain/progression";
import type { Measure } from "@/lib/domain/types";

/** Metadatos de sincronización que llevan todos los registros. */
export interface SyncMeta {
  id: string;
  /** ms desde epoch de la última modificación local (gana el más reciente). */
  updatedAt: number;
  /** 1 = pendiente de subir a Supabase. */
  _dirty: 0 | 1;
  _deleted?: boolean;
}

export interface KvRow<T = unknown> extends SyncMeta {
  valor: T;
}

export interface WorkoutSet {
  objetivoPeso: number | null;
  objetivoReps: number;
  pesoKg: number | null;
  reps: number | null;
  rir: number | null;
  hecho: boolean;
  hora?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  /** Si se sustituyó durante la sesión, el ejercicio original. */
  sustituyeA?: string;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
  rir: number;
  biserie?: string;
  ultimoRecurso?: boolean;
  alternativaPreferida?: string;
  estado: EstadoProgresion;
  mensaje: string;
  buenaTecnica: boolean;
  series: WorkoutSet[];
}

export interface Workout extends SyncMeta {
  fecha: string;
  planDayId: string;
  nombre: string;
  estado: "en_curso" | "completado";
  inicio: string;
  fin?: string;
  descarga: boolean;
  ejercicios: WorkoutExercise[];
  notas: string;
}

export interface AbsSessionItem {
  exerciseId: string;
  series: number;
  objetivo: number;
  medida: Measure;
  hechas: number;
}

export interface AbsSession extends SyncMeta {
  fecha: string;
  completado: boolean;
  items: AbsSessionItem[];
  duracionSeg: number;
}

export interface ArmExercise extends SyncMeta {
  nombre: string;
  descripcion: string;
  medida: Measure;
  series: number;
  objetivo: number;
  carga: string;
  videoUrl?: string;
  /** Vídeo propio guardado solo en este dispositivo (tabla media). */
  mediaId?: string;
  ilustracion?: string;
  origen: "propio" | "catalogo" | "profesional";
  catalogoId?: string;
  activo: boolean;
  orden: number;
}

export interface ArmEntry {
  armExerciseId: string;
  nombre: string;
  medida: Measure;
  series: { valor: number | null; carga: string; hecho: boolean }[];
}

export interface ArmSession extends SyncMeta {
  fecha: string;
  entradas: ArmEntry[];
  dolorAntes: number;
  dolorDespues: number | null;
  completado: boolean;
  notas: string;
}

export interface BodyWeight extends SyncMeta {
  fecha: string;
  kg: number;
}

/** Nota persistente por ejercicio (id = exerciseId). */
export interface ExerciseNote extends SyncMeta {
  texto: string;
}

/** Ficheros locales (vídeos propios). No se sincronizan. */
export interface MediaRow {
  id: string;
  blob: Blob;
  tipo: string;
  nombre: string;
}
