import { describe, expect, it } from "vitest";
import { ALIMENTOS, sumarNutrientes } from "../nutrition/alimentos";
import { consejosDelDia, objetivosDiarios, tmb } from "../nutrition/objetivos";
import { analizarTexto, cambiarGramos } from "../nutrition/parser";

const perfil = { pesoKg: 75, alturaCm: 178, edad: 28, sexo: "hombre" as const, objetivo: "hipertrofia" as const, dias: [6, 0] as (0 | 6)[] };

describe("tabla de alimentos", () => {
  it("ids únicos y macros coherentes con las kcal (±25 %)", () => {
    const ids = ALIMENTOS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ALIMENTOS) {
      const calc = a.proteinas * 4 + a.carbohidratos * 4 + a.grasas * 9;
      if (a.kcal < 20 || ["cerveza", "vino"].includes(a.id)) continue; // el alcohol aporta 7 kcal/g fuera de los macros
      expect(Math.abs(calc - a.kcal) / a.kcal, a.id).toBeLessThan(0.25);
    }
  });
});

describe("interpretar lo que he comido", () => {
  it("cantidades, unidades y alias compuestos", () => {
    const r = analizarTexto("2 huevos, una tostada con aceite y un café con leche");
    const nombres = r.items.map((i) => i.alimentoId);
    expect(nombres).toEqual(["huevo", "pan_molde", "aceite_oliva", "cafe_con_leche"]);
    expect(r.items[0].gramos).toBe(120);
    expect(r.items[1].gramos).toBe(30);
  });

  it("gramos explícitos y raciones", () => {
    const r = analizarTexto("200 g de arroz, un plato de lentejas y 150g de pechuga de pollo");
    expect(r.items.map((i) => [i.alimentoId, i.gramos])).toEqual([
      ["arroz_cocido", 200],
      ["lentejas", 300],
      ["pollo_pechuga", 150],
    ]);
    expect(r.items[2].proteinas).toBeCloseTo(46.5, 0);
  });

  it("acentos, mayúsculas y cucharadas", () => {
    const r = analizarTexto("Plátano y 2 cucharadas de crema de cacahuete");
    expect(r.items.map((i) => [i.alimentoId, i.gramos])).toEqual([
      ["platano", 120],
      ["crema_cacahuete", 30],
    ]);
  });

  it("separa lo que no reconoce", () => {
    const r = analizarTexto("un yogur y tarta de queso de la abuela");
    expect(r.items.map((i) => i.alimentoId)).toContain("yogur_natural");
    expect(r.sinReconocer.join(" ")).toContain("tarta");
  });

  it("cambiar los gramos recalcula proporcionalmente", () => {
    const [arroz] = analizarTexto("100 g de arroz").items;
    const doble = cambiarGramos(arroz, 200);
    expect(doble.kcal).toBe(arroz.kcal * 2);
  });
});

describe("objetivos diarios", () => {
  it("Mifflin-St Jeor", () => {
    expect(Math.round(tmb(75, 178, 28, "hombre"))).toBe(1728);
  });

  it("hipertrofia → superávit; proteína 1,8 g/kg; macros cuadran con las kcal", () => {
    const o = objetivosDiarios(perfil);
    expect(o.objetivo).toBe("ganar");
    expect(o.kcal).toBeGreaterThan(o.gasto);
    expect(o.proteinas).toBe(135);
    const kcalMacros = o.proteinas * 4 + o.carbohidratos * 4 + o.grasas * 9;
    expect(Math.abs(kcalMacros - o.kcal)).toBeLessThan(20);
  });

  it("perder peso → déficit sin bajar de la TMB y más proteína", () => {
    const o = objetivosDiarios(perfil, { objetivo: "perder", kcalManual: null, proteinaManual: null });
    expect(o.kcal).toBeLessThan(o.gasto);
    expect(o.kcal).toBeGreaterThanOrEqual(o.tmb);
    expect(o.proteinas).toBe(150);
  });

  it("valores manuales mandan y sin datos avisa", () => {
    const o = objetivosDiarios({ ...perfil, pesoKg: null }, { objetivo: "auto", kcalManual: 2500, proteinaManual: 160 });
    expect(o.kcal).toBe(2500);
    expect(o.proteinas).toBe(160);
    expect(o.notas.length).toBe(1);
  });
});

describe("consejos", () => {
  const o = objetivosDiarios(perfil);

  it("por la noche, si faltan muchas kcal y proteína, lo dice y propone alimentos", () => {
    const comido = sumarNutrientes(...analizarTexto("un bocadillo de jamón y una manzana").items);
    const c = consejosDelDia(comido, o, 22);
    expect(c.some((x) => x.texto.includes("Te faltan") && x.texto.includes("kcal"))).toBe(true);
    expect(c.some((x) => x.texto.includes("proteína"))).toBe(true);
  });

  it("avisa si te pasas", () => {
    const c = consejosDelDia({ ...comidoVacio(), kcal: o.kcal * 1.3 }, o, 22);
    expect(c[0].nivel).toBe("aviso");
    expect(c[0].texto).toContain("por encima");
  });

  it("sin registros, informa del objetivo", () => {
    expect(consejosDelDia(comidoVacio(), o, 9)[0].texto).toContain(String(o.kcal));
  });
});

function comidoVacio() {
  return { kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0, azucares: 0, sal: 0 };
}
