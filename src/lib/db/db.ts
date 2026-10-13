import Dexie, { type Table } from "dexie";
import type {
  AbsSession,
  ArmExercise,
  ArmSession,
  BodyWeight,
  Comida,
  ExerciseNote,
  KvRow,
  MediaRow,
  Workout,
} from "./types";

export const DB_NOMBRE = "gym-pwa";

export class GymDB extends Dexie {
  kv!: Table<KvRow, string>;
  workouts!: Table<Workout, string>;
  absSessions!: Table<AbsSession, string>;
  armExercises!: Table<ArmExercise, string>;
  armSessions!: Table<ArmSession, string>;
  bodyweights!: Table<BodyWeight, string>;
  notas!: Table<ExerciseNote, string>;
  comidas!: Table<Comida, string>;
  media!: Table<MediaRow, string>;

  constructor() {
    super(DB_NOMBRE);
    this.version(1).stores({
      kv: "id, updatedAt, _dirty",
      workouts: "id, fecha, estado, updatedAt, _dirty",
      absSessions: "id, fecha, updatedAt, _dirty",
      armExercises: "id, orden, updatedAt, _dirty",
      armSessions: "id, fecha, updatedAt, _dirty",
      bodyweights: "id, fecha, updatedAt, _dirty",
      notas: "id, updatedAt, _dirty",
      media: "id",
    });
    // v2: módulo de dieta.
    this.version(2).stores({ comidas: "id, fecha, updatedAt, _dirty" });
  }
}

/** Tablas que se sincronizan con Supabase (todas salvo media). */
export const COLECCIONES = ["kv", "workouts", "absSessions", "armExercises", "armSessions", "bodyweights", "notas", "comidas"] as const;
export type Coleccion = (typeof COLECCIONES)[number];

let instancia: GymDB | null = null;

export function db(): GymDB {
  if (!instancia) instancia = new GymDB();
  return instancia;
}
