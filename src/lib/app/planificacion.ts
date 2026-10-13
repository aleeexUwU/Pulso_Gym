import { coberturaAbdominalesSemana } from "@/lib/domain/abs-routine";
import { hoyISO, inicioSemana } from "@/lib/domain/dates";
import { ajustesPorDefecto } from "@/lib/domain/defaults";
import { generarPlan, repararPlan, type GeneratorInput } from "@/lib/domain/generator";
import type { ArmAssessment } from "@/lib/domain/left-arm";
import type { FiltroEjercicios } from "@/lib/domain/limitations";
import { mejorAlternativaEnPlan, sustituirEnPlan } from "@/lib/domain/substitution";
import type { Plan, Profile, Settings } from "@/lib/domain/types";
import { escribirKv, leerKv } from "@/lib/db/repo";

export function filtroGimnasio(perfil: Profile): FiltroEjercicios {
  return { equipo: perfil.equipo, limitaciones: perfil.limitaciones, excluidos: perfil.excluidos };
}

/** Filtro del core en casa: material de casa y autoevaluación del brazo izquierdo. */
export function filtroCasa(perfil: Profile, ajustes: Settings, ev: ArmAssessment | null | undefined): FiltroEjercicios {
  return {
    equipo: ajustes.equipoCasa,
    limitaciones: perfil.limitaciones,
    excluidos: perfil.excluidos,
    // La plancha sobre antebrazos entra salvo que la autoevaluación del brazo diga que no es cómoda.
    permiteApoyoAntebrazoIzq: ev?.apoyoAntebrazoComodo !== "no",
  };
}

export function entradaGenerador(
  perfil: Profile,
  ajustes: Settings,
  ev: ArmAssessment | null | undefined,
  hoy = hoyISO(),
): GeneratorInput {
  return {
    dias: perfil.dias,
    duracionMin: perfil.duracionMin,
    objetivo: perfil.objetivo,
    experiencia: perfil.experiencia,
    equipo: perfil.equipo,
    limitaciones: perfil.limitaciones,
    excluidos: perfil.excluidos,
    seriesMinimas: ajustes.seriesMinimas,
    biseries: ajustes.biseries,
    coberturaCasa: coberturaAbdominalesSemana(
      inicioSemana(hoy),
      ajustes.inicioAbdominales,
      filtroCasa(perfil, ajustes, ev),
      ajustes.abdominalesDiasSemana,
    ),
  };
}

async function contexto() {
  const perfil = await leerKv("perfil");
  if (!perfil) throw new Error("Falta el perfil");
  const ajustes = { ...ajustesPorDefecto(), ...((await leerKv("ajustes")) ?? {}) };
  const ev = await leerKv("evaluacionBrazo");
  return { perfil, ajustes, ev };
}

/** Regenera la rutina con el perfil y ajustes actuales (el historial no se toca). */
export async function regenerarPlan(): Promise<Plan> {
  const { perfil, ajustes, ev } = await contexto();
  const plan = generarPlan(entradaGenerador(perfil, ajustes, ev));
  await escribirKv("plan", plan);
  return plan;
}

/** Sustituye un ejercicio en el plan y completa la cobertura si hiciera falta. */
export async function sustituirEnPlanGuardado(deId: string, aId: string): Promise<Plan | null> {
  const { perfil, ajustes, ev } = await contexto();
  const plan = await leerKv("plan");
  if (!plan) return null;
  const nuevo = repararPlan(sustituirEnPlan(plan, deId, aId), entradaGenerador(perfil, ajustes, ev));
  await escribirKv("plan", nuevo);
  return nuevo;
}

/**
 * Marca un ejercicio como doloroso: no vuelve a salir y se sustituye
 * automáticamente por la mejor alternativa. Devuelve el sustituto (o null).
 */
export async function marcarDolorEnPlan(exerciseId: string): Promise<string | null> {
  const { perfil } = await contexto();
  const excluidos = [...new Set([...perfil.excluidos, exerciseId])];
  const nuevoPerfil = { ...perfil, excluidos };
  await escribirKv("perfil", nuevoPerfil);
  const plan = await leerKv("plan");
  if (!plan) return null;
  const alt = mejorAlternativaEnPlan(plan, exerciseId, filtroGimnasio(nuevoPerfil));
  const { ajustes, ev } = await contexto();
  const input = entradaGenerador(nuevoPerfil, ajustes, ev);
  const base = alt
    ? sustituirEnPlan(plan, exerciseId, alt.id)
    : { ...plan, dias: plan.dias.map((d) => ({ ...d, ejercicios: d.ejercicios.filter((pe) => pe.exerciseId !== exerciseId) })) };
  await escribirKv("plan", repararPlan(base, input));
  return alt?.id ?? null;
}

export async function quitarDolor(exerciseId: string): Promise<void> {
  const { perfil } = await contexto();
  await escribirKv("perfil", { ...perfil, excluidos: perfil.excluidos.filter((x) => x !== exerciseId) });
}

export async function guardarAjustes(cambios: Partial<Settings>): Promise<Settings> {
  const actual = { ...ajustesPorDefecto(), ...((await leerKv("ajustes")) ?? {}) };
  const nuevo = { ...actual, ...cambios };
  await escribirKv("ajustes", nuevo);
  return nuevo;
}
