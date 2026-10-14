import type { ArmAssessment } from "@/lib/domain/left-arm";
import type { Plan, Profile, Settings } from "@/lib/domain/types";
import { db, type Coleccion } from "./db";
import type { KvRow, Receta, SyncMeta } from "./types";

type Listener = () => void;
const listeners = new Set<Listener>();

/** El módulo de sincronización se suscribe para subir cambios tras cada escritura. */
export function onCambioLocal(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notificar() {
  for (const fn of listeners) fn();
}

export function nuevoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type SinMeta<T extends SyncMeta> = Omit<T, "updatedAt" | "_dirty"> & Partial<SyncMeta>;

/** Guarda un registro marcándolo como pendiente de sincronizar. */
export async function guardar<T extends SyncMeta>(tabla: Coleccion, obj: SinMeta<T>): Promise<T> {
  const fila = { ...obj, updatedAt: Date.now(), _dirty: 1 as const } as unknown as T;
  await db().table(tabla).put(fila);
  notificar();
  return fila;
}

/** Borrado lógico (para que el borrado también se sincronice). */
export async function borrar(tabla: Coleccion, id: string): Promise<void> {
  const t = db().table(tabla);
  const fila = await t.get(id);
  if (!fila) return;
  await t.put({ ...fila, _deleted: true, updatedAt: Date.now(), _dirty: 1 });
  notificar();
}

export const vivos = <T extends SyncMeta>(rows: T[]) => rows.filter((r) => !r._deleted);

// ── Clave-valor: perfil, ajustes, plan, evaluación del brazo ──

export type ClaveKv = "perfil" | "ajustes" | "plan" | "evaluacionBrazo" | "recetas";

export interface ValoresKv {
  perfil: Profile;
  ajustes: Settings;
  plan: Plan;
  evaluacionBrazo: ArmAssessment;
  recetas: Receta[];
}

export async function leerKv<K extends ClaveKv>(clave: K): Promise<ValoresKv[K] | undefined> {
  const fila = (await db().kv.get(clave)) as KvRow<ValoresKv[K]> | undefined;
  return fila && !fila._deleted ? fila.valor : undefined;
}

export async function escribirKv<K extends ClaveKv>(clave: K, valor: ValoresKv[K]): Promise<void> {
  await guardar<KvRow<ValoresKv[K]>>("kv", { id: clave, valor });
}
