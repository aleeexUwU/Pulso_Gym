"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { ajustesPorDefecto } from "@/lib/domain/defaults";
import type { Settings } from "@/lib/domain/types";
import { db } from "./db";
import { leerKv, vivos, type ClaveKv, type ValoresKv } from "./repo";
import type { AbsSession, ArmExercise, ArmSession, BodyWeight, ExerciseNote, Workout } from "./types";

/** undefined = cargando · null = no existe. */
export function useKv<K extends ClaveKv>(clave: K): ValoresKv[K] | null | undefined {
  return useLiveQuery(async () => (await leerKv(clave)) ?? null, [clave]);
}

export const usePerfil = () => useKv("perfil");
export const usePlan = () => useKv("plan");
export const useEvaluacionBrazo = () => useKv("evaluacionBrazo");

/** Ajustes con valores por defecto para los campos que falten (versiones antiguas). */
export function useAjustes(): Settings | undefined {
  const a = useKv("ajustes");
  return useMemo(() => {
    if (a === undefined) return undefined;
    const base = ajustesPorDefecto();
    return a ? { ...base, ...a, incrementos: { ...base.incrementos, ...a.incrementos } } : base;
  }, [a]);
}

export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(async () => vivos(await db().workouts.orderBy("fecha").toArray()), []);
}

export function useWorkout(id: string | null): Workout | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    const w = await db().workouts.get(id);
    return w && !w._deleted ? w : null;
  }, [id]);
}

export function useAbsSessions(): AbsSession[] | undefined {
  return useLiveQuery(async () => vivos(await db().absSessions.orderBy("fecha").toArray()), []);
}

export function useArmExercises(): ArmExercise[] | undefined {
  return useLiveQuery(async () => vivos(await db().armExercises.orderBy("orden").toArray()), []);
}

export function useArmSessions(): ArmSession[] | undefined {
  return useLiveQuery(async () => vivos(await db().armSessions.orderBy("fecha").toArray()), []);
}

export function useBodyweights(): BodyWeight[] | undefined {
  return useLiveQuery(async () => vivos(await db().bodyweights.orderBy("fecha").toArray()), []);
}

export function useNota(exerciseId: string): ExerciseNote | null | undefined {
  return useLiveQuery(async () => {
    const n = await db().notas.get(exerciseId);
    return n && !n._deleted ? n : null;
  }, [exerciseId]);
}
