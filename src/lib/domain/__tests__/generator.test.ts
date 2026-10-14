import { describe, expect, it } from "vitest";
import { coberturaAbdominalesSemana } from "../abs-routine";
import { EJERCICIOS, EJERCICIOS_GIMNASIO, ejercicio } from "../exercises";
import { candidatos, generarPlan, repararPlan, type GeneratorInput } from "../generator";
import { requiereManoIzquierda } from "../limitations";
import { EQUIPO_GIMNASIO_COMPLETO, GRUPOS, GRUPOS_GIMNASIO } from "../muscles";
import { mejorAlternativaEnPlan, sustituirEnPlan } from "../substitution";
import type { Equipment, MuscleGroup, Weekday } from "../types";

const LUNES = "2026-10-12";

function entrada(dias: Weekday[], extra: Partial<GeneratorInput> = {}): GeneratorInput {
  const base = {
    equipo: EQUIPO_GIMNASIO_COMPLETO,
    limitaciones: ["mano_izquierda" as const],
    excluidos: [] as string[],
  };
  const filtro = { ...base, ...extra };
  return {
    dias,
    duracionMin: 90,
    objetivo: "hipertrofia",
    experiencia: "principiante",
    seriesMinimas: 10,
    ...base,
    coberturaCasa: coberturaAbdominalesSemana(LUNES, LUNES, filtro),
    ...extra,
  };
}

const CONFIGS: [string, Weekday[]][] = [
  ["2 días (sábado y domingo)", [6, 0]],
  ["3 días", [1, 3, 5]],
  ["4 días", [1, 2, 4, 5]],
];

describe("catálogo del módulo gimnasio", () => {
  it("ningún ejercicio del gimnasio requiere la mano izquierda", () => {
    for (const e of EJERCICIOS_GIMNASIO) {
      expect(requiereManoIzquierda(e), e.id).toBe(false);
      expect(e.manoIzquierda, e.id).toBe("ninguna");
    }
  });

  it("no hay barra libre en todo el catálogo", () => {
    for (const e of EJERCICIOS) expect(e.barraLibre, e.id).toBe(false);
  });

  it("todo ejercicio Smith está marcado como último recurso con alternativa preferida válida", () => {
    for (const e of EJERCICIOS_GIMNASIO.filter((x) => x.smith)) {
      expect(e.alternativaPreferida, e.id).toBeTruthy();
      expect(ejercicio(e.alternativaPreferida!).smith).toBe(false);
    }
  });

  it("los ids son únicos y cada ejercicio tiene pasos y errores", () => {
    const ids = EJERCICIOS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of EJERCICIOS) {
      expect(e.pasos.length, e.id).toBeGreaterThan(0);
      expect(e.errores.length, e.id).toBeGreaterThan(0);
    }
  });
});

describe.each(CONFIGS)("generador con %s", (_nombre, dias) => {
  const plan = generarPlan(entrada(dias));

  it("genera un día por cada día elegido", () => {
    expect(plan.dias.map((d) => d.diaSemana).sort()).toEqual([...dias].sort());
  });

  it("todos los grupos musculares reciben el volumen mínimo semanal", () => {
    for (const g of GRUPOS) expect(plan.cobertura[g], g).toBeGreaterThanOrEqual(10 - 1e-9);
    expect(plan.gruposSinCubrir).toEqual([]);
  });

  it("cada grupo del gimnasio tiene al menos un ejercicio directo a la semana", () => {
    for (const g of GRUPOS_GIMNASIO) {
      const directo = plan.dias.some((d) =>
        d.ejercicios.some((pe) => (ejercicio(pe.exerciseId).musculos[g] ?? 0) >= 1),
      );
      expect(directo, g).toBe(true);
    }
  });

  it("ningún ejercicio del plan usa la mano izquierda, barra libre ni Smith (hay alternativas)", () => {
    for (const d of plan.dias)
      for (const pe of d.ejercicios) {
        const e = ejercicio(pe.exerciseId);
        expect(requiereManoIzquierda(e), e.id).toBe(false);
        expect(e.barraLibre).toBe(false);
        expect(e.smith, e.id).toBe(false);
        expect(pe.ultimoRecurso).toBeFalsy();
      }
  });

  it("los compuestos van antes que los aislamientos", () => {
    for (const d of plan.dias) {
      const flags = d.ejercicios.map((pe) => ejercicio(pe.exerciseId).compuesto);
      const primerAisl = flags.indexOf(false);
      if (primerAisl >= 0) expect(flags.slice(primerAisl).includes(true)).toBe(false);
    }
  });

  it("es determinista", () => {
    expect(generarPlan(entrada(dias)).dias).toEqual(plan.dias);
  });
});

describe("cobertura con otros mínimos y días", () => {
  it.each([8, 12, 15])("garantiza %i series por grupo con 3 días", (min) => {
    const plan = generarPlan(entrada([1, 3, 5], { seriesMinimas: min }));
    for (const g of GRUPOS) expect(plan.cobertura[g], g).toBeGreaterThanOrEqual(min - 1e-9);
  });

  it("con 4 días el reparto pasa a torso/pierna", () => {
    const plan = generarPlan(entrada([1, 2, 4, 5]));
    expect(plan.dias.map((d) => d.enfoque)).toEqual(["torso", "pierna", "torso", "pierna"]);
  });

  it.each([5, 6])("con %i días también cubre todos los grupos", (n) => {
    const dias = ([1, 2, 3, 4, 5, 6] as Weekday[]).slice(0, n);
    const plan = generarPlan(entrada(dias));
    for (const g of GRUPOS) expect(plan.cobertura[g], g).toBeGreaterThanOrEqual(10 - 1e-9);
  });
});

describe("máquina Smith y barra libre", () => {
  it("la Smith solo se elige cuando no hay ninguna alternativa con el material configurado", () => {
    const equipo: Equipment[] = ["smith", "banco", "banco_inclinable"];
    const plan = generarPlan(entrada([6, 0], { equipo }));
    const usados = plan.dias.flatMap((d) => d.ejercicios);
    for (const pe of usados) {
      const e = ejercicio(pe.exerciseId);
      if (!e.smith) continue;
      expect(pe.ultimoRecurso).toBe(true);
      expect(pe.alternativaPreferida).toBeTruthy();
      const grupos = Object.entries(e.musculos)
        .filter(([, w]) => (w ?? 0) >= 1)
        .map(([g]) => g as MuscleGroup);
      for (const g of grupos) {
        const c = candidatos(g, { equipo, limitaciones: ["mano_izquierda"], excluidos: [] });
        expect(c.ultimoRecurso, `${e.id}/${g}`).toBe(true);
      }
    }
    // Pecho no tiene alternativa sin material → Smith (último recurso).
    expect(usados.some((pe) => pe.exerciseId === "press_smith_una_mano")).toBe(true);
    // Cuádriceps sí tiene alternativa (peso corporal) → la Smith NO aparece.
    expect(usados.some((pe) => pe.exerciseId === "sentadilla_smith")).toBe(false);
    expect(plan.avisos.some((a) => a.includes("último recurso"))).toBe(true);
  });

  it("con gimnasio completo + Smith, la Smith no aparece", () => {
    const plan = generarPlan(entrada([6, 0], { equipo: [...EQUIPO_GIMNASIO_COMPLETO, "smith"] }));
    for (const d of plan.dias) for (const pe of d.ejercicios) expect(ejercicio(pe.exerciseId).smith).toBe(false);
  });

  it("la barra libre nunca aparece en ninguna configuración de material", () => {
    const configs: Equipment[][] = [EQUIPO_GIMNASIO_COMPLETO, ["mancuernas", "banco"], ["polea"], ["smith"], []];
    for (const equipo of configs) {
      for (const [, dias] of CONFIGS) {
        const plan = generarPlan(entrada(dias, { equipo }));
        for (const d of plan.dias)
          for (const pe of d.ejercicios) expect(ejercicio(pe.exerciseId).barraLibre).toBe(false);
      }
    }
  });
});

describe("limitaciones, dolor y sustituciones", () => {
  it("un ejercicio marcado con dolor no vuelve a aparecer", () => {
    const plan = generarPlan(entrada([6, 0], { excluidos: ["prensa"] }));
    expect(plan.dias.flatMap((d) => d.ejercicios).some((pe) => pe.exerciseId === "prensa")).toBe(false);
  });

  it("la limitación de rodilla quita las sentadillas profundas", () => {
    const plan = generarPlan(entrada([1, 3, 5], { limitaciones: ["mano_izquierda", "rodilla"] }));
    for (const d of plan.dias)
      for (const pe of d.ejercicios) expect(ejercicio(pe.exerciseId).tags.includes("rodilla_profunda")).toBe(false);
  });

  it("sustituir y reparar mantiene la cobertura completa", () => {
    const input = entrada([6, 0]);
    const plan = generarPlan(input);
    const original = plan.dias[0].ejercicios[0].exerciseId;
    const filtro = { equipo: input.equipo, limitaciones: input.limitaciones, excluidos: [original] };
    const alt = mejorAlternativaEnPlan(plan, original, filtro);
    expect(alt).toBeTruthy();
    expect(requiereManoIzquierda(alt!)).toBe(false);
    const reparado = repararPlan(sustituirEnPlan(plan, original, alt!.id), { ...input, excluidos: [original] });
    expect(reparado.dias.flatMap((d) => d.ejercicios).some((pe) => pe.exerciseId === original)).toBe(false);
    for (const g of GRUPOS) expect(reparado.cobertura[g], g).toBeGreaterThanOrEqual(10 - 1e-9);
  });
});

describe("principiante: sin mancuernas y prioridad de tren superior (3 días)", () => {
  const input = entrada([1, 3, 5], { evitarMancuernas: true, prioridad: "superior" });
  const plan = generarPlan(input);

  it("no usa mancuernas si hay máquina o polea para el grupo", () => {
    const conMancuerna = plan.dias.flatMap((d) => d.ejercicios).filter((pe) => ejercicio(pe.exerciseId).tipoCarga === "mancuerna");
    expect(conMancuerna.map((pe) => pe.exerciseId)).toEqual([]);
  });

  it("torso con 2 series más que el mínimo y pierna con menos, todo cubierto", () => {
    expect(plan.gruposSinCubrir).toEqual([]);
    expect(plan.minimos?.pecho).toBe(12);
    expect(plan.minimos?.cuadriceps).toBe(6);
    for (const g of GRUPOS_GIMNASIO) expect(plan.cobertura[g] + 1e-9, g).toBeGreaterThanOrEqual(plan.minimos![g]);
  });

  it("pecho y dorsal se entrenan en cada sesión y el torso va antes que la pierna", () => {
    for (const d of plan.dias) {
      const primero = ejercicio(d.ejercicios[0].exerciseId);
      expect(["pecho", "dorsal", "hombro_anterior"].some((g) => (primero.musculos[g as MuscleGroup] ?? 0) >= 1), d.nombre).toBe(true);
      for (const g of ["pecho", "dorsal"] as MuscleGroup[]) {
        expect(d.ejercicios.some((pe) => (ejercicio(pe.exerciseId).musculos[g] ?? 0) >= 1), `${d.nombre} ${g}`).toBe(true);
      }
    }
  });

  it("máquina guiada antes que polea: sin cruce en polea si hay press y contractora", () => {
    const ids = plan.dias.flatMap((d) => d.ejercicios.map((pe) => pe.exerciseId));
    expect(ids).not.toContain("cruce_polea_una_mano");
  });

  it("sesiones de duración razonable", () => {
    for (const d of plan.dias) {
      expect(d.duracionEstimadaMin).toBeLessThanOrEqual(90);
    }
  });
});
