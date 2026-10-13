import { describe, expect, it } from "vitest";
import { CATEGORIAS_CORE, resolverProgresion, rutinaAbdominales } from "../abs-routine";
import { sumarDias } from "../dates";
import { ajustesPorDefecto, perfilPorDefecto } from "../defaults";
import { EJERCICIOS_ABDOMINALES, ejercicio } from "../exercises";
import { generarPlan } from "../generator";
import { CATALOGO_BRAZO_IZQUIERDO, avisoDolor, ejerciciosCompatibles, evaluacionVacia } from "../left-arm";
import type { FiltroEjercicios } from "../limitations";
import { mejorRacha, planSemanal, racha } from "../weekly-plan";

const LUNES = "2026-10-12";
const filtroCasa: FiltroEjercicios = { equipo: [], limitaciones: ["mano_izquierda"], excluidos: [] };

function idsEn28Dias(filtro: FiltroEjercicios): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < 28; i++) {
    rutinaAbdominales(sumarDias(LUNES, i), LUNES, filtro).items.forEach((it) => ids.add(it.exerciseId));
  }
  return ids;
}

describe("módulo brazo izquierdo", () => {
  it("está desactivado por defecto", () => {
    expect(ajustesPorDefecto(LUNES).moduloBrazo).toBe(false);
  });

  it("desactivado, no genera nada en el plan semanal aunque haya días asignados", () => {
    const perfil = perfilPorDefecto();
    const plan = generarPlan({ ...perfil, seriesMinimas: 10 });
    const semana = planSemanal(LUNES, plan, ajustesPorDefecto(LUNES), [0, 1, 2, 3, 4, 5, 6]);
    expect(semana.some((a) => a.tipo === "brazo")).toBe(false);
    expect(semana.filter((a) => a.tipo === "gimnasio")).toHaveLength(2);
    expect(semana.filter((a) => a.tipo === "abdominales")).toHaveLength(7);
  });

  it("activado, aparece solo en los días elegidos", () => {
    const semana = planSemanal(LUNES, null, { ...ajustesPorDefecto(LUNES), moduloBrazo: true }, [2, 4]);
    expect(semana.filter((a) => a.tipo === "brazo").map((a) => a.fecha)).toEqual(["2026-10-13", "2026-10-15"]);
  });

  it("la autoevaluación filtra el catálogo (sin agarre no hay ejercicios de agarre)", () => {
    const ev = { ...evaluacionVacia(LUNES), agarra: "no" as const, rotaHombro: "no" as const };
    const ok = ejerciciosCompatibles(ev);
    expect(ok.length).toBeGreaterThan(0);
    expect(ok.some((e) => e.requiere.agarre)).toBe(false);
    expect(ok.some((e) => e.requiere.rotacionHombro)).toBe(false);
    expect(ok.length).toBeLessThan(CATALOGO_BRAZO_IZQUIERDO.length);
  });

  it("avisa cuando el dolor supera 3", () => {
    expect(avisoDolor(2).nivel).toBe("ok");
    expect(avisoDolor(4).nivel).toBe("precaucion");
    expect(avisoDolor(7).nivel).toBe("parar");
  });
});

describe("módulo abdominales", () => {
  it("cada día trabaja recto, oblicuos, transverso y lumbar en 8–16 min", () => {
    for (let i = 0; i < 21; i++) {
      const fecha = sumarDias(LUNES, i);
      const r = rutinaAbdominales(fecha, LUNES, filtroCasa);
      for (const c of CATEGORIAS_CORE) expect(r.items.some((it) => it.categoria === c), `${fecha} ${c}`).toBe(true);
      expect(r.duracionEstimadaMin, fecha).toBeGreaterThanOrEqual(8);
      expect(r.duracionEstimadaMin, fecha).toBeLessThanOrEqual(16);
    }
  });

  it("varía entre días", () => {
    const a = rutinaAbdominales(LUNES, LUNES, filtroCasa).items.map((i) => i.exerciseId);
    const b = rutinaAbdominales(sumarDias(LUNES, 1), LUNES, filtroCasa).items.map((i) => i.exerciseId);
    expect(a).not.toEqual(b);
  });

  it("ningún ejercicio carga la mano izquierda; la plancha sobre antebrazos solo sale si es cómoda", () => {
    for (const e of EJERCICIOS_ABDOMINALES) expect(["agarre", "apoyo_mano"]).not.toContain(e.manoIzquierda);
    const sin = idsEn28Dias(filtroCasa);
    expect(sin.has("plancha_antebrazos")).toBe(false);
    expect(sin.has("plancha_lateral_izquierda")).toBe(false);
    const con = idsEn28Dias({ ...filtroCasa, permiteApoyoAntebrazoIzq: true });
    expect(con.has("plancha_antebrazos")).toBe(true);
  });

  it("sin banda elástica no aparece el Pallof", () => {
    expect(idsEn28Dias(filtroCasa).has("pallof_banda")).toBe(false);
    expect(idsEn28Dias({ ...filtroCasa, equipo: ["banda_elastica"] }).has("pallof_banda")).toBe(true);
  });

  it("progresa cada semana y pasa a una variante más difícil al llegar al tope", () => {
    const crunch = ejercicio("crunch");
    expect(resolverProgresion(crunch, 0).objetivo).toBe(12);
    expect(resolverProgresion(crunch, 1).objetivo).toBe(14);
    const lejos = resolverProgresion(crunch, 10);
    expect(lejos.ejercicio.id).toBe("crunch_brazos_arriba");
    expect(lejos.nivel).toBe(1);
  });

  it("las series suben de 2 a 3 a partir de la tercera semana", () => {
    expect(rutinaAbdominales(LUNES, LUNES, filtroCasa).items[0].series).toBe(2);
    expect(rutinaAbdominales(sumarDias(LUNES, 14), LUNES, filtroCasa).items[0].series).toBe(3);
  });
});

describe("rachas", () => {
  it("cuenta días consecutivos hasta hoy o ayer", () => {
    expect(racha(["2026-10-10", "2026-10-11", "2026-10-12"], "2026-10-12")).toBe(3);
    expect(racha(["2026-10-10", "2026-10-11"], "2026-10-12")).toBe(2);
    expect(racha(["2026-10-09"], "2026-10-12")).toBe(0);
    expect(mejorRacha(["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07"])).toBe(3);
  });
});
