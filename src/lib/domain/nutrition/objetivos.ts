import type { Profile } from "../types";
import { ALIMENTOS, type Nutrientes } from "./alimentos";

export type ObjetivoPeso = "perder" | "mantener" | "ganar";

export interface AjustesDieta {
  /** "auto" deriva el objetivo del perfil (hipertrofia/fuerza → ganar, salud → mantener). */
  objetivo: ObjetivoPeso | "auto";
  /** Si se rellenan, sustituyen al cálculo automático. */
  kcalManual: number | null;
  proteinaManual: number | null;
  /** Ajuste aceptado tras ver la evolución del peso (kcal que se suman al cálculo). */
  ajusteKcal?: number;
}

export const AJUSTES_DIETA_POR_DEFECTO: AjustesDieta = { objetivo: "auto", kcalManual: null, proteinaManual: null, ajusteKcal: 0 };

export interface ObjetivosDia {
  kcal: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  /** Máximos recomendados (no objetivos a alcanzar). */
  salMax: number;
  azucaresMax: number;
  tmb: number;
  gasto: number;
  objetivo: ObjetivoPeso;
  /** Avisos sobre el cálculo (faltan datos, etc.). */
  notas: string[];
}

/** Tasa metabólica basal (Mifflin-St Jeor). */
export function tmb(pesoKg: number, alturaCm: number, edad: number, sexo: Profile["sexo"]): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad;
  return base + (sexo === "hombre" ? 5 : sexo === "mujer" ? -161 : -78);
}

/** Factor de actividad: base ligera (core diario) + entrenos de fuerza a la semana. */
export function factorActividad(diasGimnasio: number): number {
  return Math.min(1.75, 1.35 + 0.05 * diasGimnasio);
}

export function objetivoEfectivo(perfil: Pick<Profile, "objetivo">, aj: AjustesDieta): ObjetivoPeso {
  if (aj.objetivo !== "auto") return aj.objetivo;
  return perfil.objetivo === "salud" ? "mantener" : "ganar";
}

/**
 * Objetivos diarios. Ganar: +10 % (superávit moderado para ganar músculo sin
 * mucha grasa). Perder: −15 % sin bajar de TMB × 1,1. Proteína 1,8 g/kg (2 g/kg
 * si se pierde peso), grasa 0,9 g/kg (mín. 20 % de las kcal), el resto carbohidratos.
 */
export function objetivosDiarios(
  perfil: Pick<Profile, "pesoKg" | "alturaCm" | "edad" | "sexo" | "objetivo" | "dias">,
  aj: AjustesDieta = AJUSTES_DIETA_POR_DEFECTO,
): ObjetivosDia {
  const notas: string[] = [];
  const peso = perfil.pesoKg ?? 75;
  const altura = perfil.alturaCm ?? 175;
  const edad = perfil.edad ?? 30;
  if (perfil.pesoKg == null || perfil.alturaCm == null || perfil.edad == null) {
    notas.push("Faltan peso, altura o edad en tu perfil: uso valores típicos. Complétalos en Ajustes para afinar.");
  }
  const basal = tmb(peso, altura, edad, perfil.sexo);
  const gasto = basal * factorActividad(perfil.dias.length);
  const objetivo = objetivoEfectivo(perfil, aj);
  let kcal = objetivo === "ganar" ? gasto * 1.1 : objetivo === "perder" ? Math.max(basal * 1.1, gasto * 0.85) : gasto;
  kcal += aj.ajusteKcal ?? 0;
  if (aj.kcalManual) kcal = aj.kcalManual;
  kcal = Math.round(kcal / 10) * 10;

  const proteinas = Math.round(aj.proteinaManual ?? peso * (objetivo === "perder" ? 2 : 1.8));
  const grasas = Math.round(Math.max(peso * 0.9, (kcal * 0.2) / 9));
  const carbohidratos = Math.max(0, Math.round((kcal - proteinas * 4 - grasas * 9) / 4));
  return {
    kcal,
    proteinas,
    carbohidratos,
    grasas,
    fibra: Math.round((kcal / 1000) * 14),
    salMax: 5,
    azucaresMax: Math.round((kcal * 0.1) / 4),
    tmb: Math.round(basal),
    gasto: Math.round(gasto),
    objetivo,
    notas,
  };
}

export interface Consejo {
  nivel: "ok" | "info" | "aviso";
  texto: string;
}

/** Qué parte del día "debería" llevar comida según la hora (orientativo). */
export function fraccionEsperada(hora: number): number {
  if (hora < 10) return 0.2;
  if (hora < 13) return 0.35;
  if (hora < 16) return 0.6;
  if (hora < 19) return 0.7;
  if (hora < 22) return 0.9;
  return 1;
}

const RICOS_EN_PROTEINA = ["pollo_pechuga", "yogur_proteico", "atun_lata", "huevo", "queso_batido", "whey", "pavo", "tofu"];

/**
 * Valoración del día: si te falta comer, si te has pasado y qué añadir.
 * `hora` = hora actual (o 24 para un día ya terminado).
 */
export function consejosDelDia(
  consumido: Nutrientes,
  obj: ObjetivosDia,
  hora: number,
  opciones: { entrenoHoy?: boolean } = {},
): Consejo[] {
  const out: Consejo[] = [];
  const faltaKcal = obj.kcal - consumido.kcal;
  const faltaProt = obj.proteinas - consumido.proteinas;
  const esperado = obj.kcal * fraccionEsperada(hora);
  const finDelDia = hora >= 21;

  if (consumido.kcal === 0) {
    out.push({ nivel: "info", texto: `Aún no has registrado nada hoy. Tu objetivo: ${obj.kcal} kcal y ${obj.proteinas} g de proteína.` });
  } else if (consumido.kcal > obj.kcal * 1.1) {
    out.push({
      nivel: "aviso",
      texto: `Llevas ${Math.round(-faltaKcal)} kcal por encima de tu objetivo. Sin dramas: mañana vuelve a tu plan normal; no hace falta compensar de golpe.`,
    });
  } else if (finDelDia && faltaKcal > 300) {
    out.push({
      nivel: "aviso",
      texto: `Te faltan ${Math.round(faltaKcal)} kcal para tu objetivo. ${obj.objetivo === "ganar" ? "Para ganar músculo necesitas llegar: " : ""}añade una cena completa o un tentempié (p. ej. yogur con avena y frutos secos).`,
    });
  } else if (consumido.kcal < esperado * 0.7) {
    out.push({
      nivel: "info",
      texto: `Vas por debajo de lo esperado a esta hora (${Math.round(consumido.kcal)} de ~${Math.round(esperado)} kcal). Te quedan ${Math.round(faltaKcal)} kcal en el día.`,
    });
  } else if (faltaKcal >= -obj.kcal * 0.1 && faltaKcal <= obj.kcal * 0.05 && finDelDia) {
    out.push({ nivel: "ok", texto: "¡Día clavado en calorías! 💪" });
  } else {
    out.push({ nivel: "ok", texto: `Vas bien: te quedan ${Math.max(0, Math.round(faltaKcal))} kcal para hoy.` });
  }

  if (consumido.kcal > 0 && faltaProt > 20 && (finDelDia || consumido.proteinas < obj.proteinas * fraccionEsperada(hora) * 0.7)) {
    const ideas = RICOS_EN_PROTEINA.map((id) => ALIMENTOS.find((a) => a.id === id)!)
      .slice(0, 4)
      .map((a) => {
        const g = a.unidad ?? a.racion;
        return `${a.nombre.toLowerCase()} (${g} g ≈ ${Math.round((a.proteinas * g) / 100)} g)`;
      });
    out.push({
      nivel: "aviso",
      texto: `Te faltan ${Math.round(faltaProt)} g de proteína. Ideas: ${ideas.join(", ")}.`,
    });
  }

  if (finDelDia && consumido.kcal > 0 && consumido.fibra < obj.fibra * 0.6) {
    out.push({ nivel: "info", texto: `Poca fibra hoy (${Math.round(consumido.fibra)} de ${obj.fibra} g): más verdura, fruta, legumbre o integrales.` });
  }
  if (consumido.sal > obj.salMax) {
    out.push({ nivel: "aviso", texto: `Sal alta hoy (${consumido.sal.toFixed(1)} g; recomendado < ${obj.salMax} g).` });
  }
  if (opciones.entrenoHoy) {
    out.push({
      nivel: "info",
      texto: "Hoy toca gimnasio: reparte la proteína en 3–4 tomas e incluye carbohidratos antes y después de entrenar.",
    });
  }
  return out;
}

export interface SugerenciaAjuste {
  delta: number;
  /** Cambio de peso medido en kg por semana. */
  ritmo: number;
  motivo: string;
}

/** Pendiente (kg/día) de la recta que mejor se ajusta a los pesos (mínimos cuadrados). */
function pendiente(puntos: { dia: number; kg: number }[]): number {
  const n = puntos.length;
  const mx = puntos.reduce((s, p) => s + p.dia, 0) / n;
  const my = puntos.reduce((s, p) => s + p.kg, 0) / n;
  const num = puntos.reduce((s, p) => s + (p.dia - mx) * (p.kg - my), 0);
  const den = puntos.reduce((s, p) => s + (p.dia - mx) ** 2, 0);
  return den ? num / den : 0;
}

/**
 * ¿Toca ajustar las calorías? Mira el peso de las últimas 4 semanas (al menos 3 pesajes
 * que abarquen 14 días) y solo sugiere si has cumplido el objetivo de kcal la mayoría de
 * días registrados (si no, el problema no es el objetivo). Rangos orientativos:
 * ganar músculo ≈ +0,1–0,5 kg/semana; perder grasa ≈ −0,25–1 kg/semana.
 */
export function sugerenciaAjuste(
  pesos: { fecha: string; kg: number }[],
  objetivo: ObjetivoPeso,
  kcalPorDia: number[],
  objetivoKcal: number,
  hoy: string,
): SugerenciaAjuste | null {
  const dia = (f: string) => Math.round((Date.parse(f) - Date.parse(hoy)) / 86_400_000);
  const recientes = pesos.filter((p) => dia(p.fecha) >= -28 && dia(p.fecha) <= 0).map((p) => ({ dia: dia(p.fecha), kg: p.kg }));
  if (recientes.length < 3) return null;
  const dias = recientes.map((p) => p.dia);
  if (Math.max(...dias) - Math.min(...dias) < 14) return null;
  const registrados = kcalPorDia.filter((k) => k > 0);
  if (registrados.length < 7) return null;
  const cumplidos = registrados.filter((k) => k >= objetivoKcal * 0.9).length / registrados.length;
  const ritmo = Math.round(pendiente(recientes) * 7 * 100) / 100;
  const r = (d: number, motivo: string): SugerenciaAjuste => ({ delta: d, ritmo, motivo });
  const kg = (x: number) => `${x > 0 ? "+" : ""}${String(x).replace(".", ",")} kg/semana`;

  if (objetivo === "ganar") {
    if (ritmo < 0.1 && cumplidos >= 0.7) return r(150, `Tu peso va a ${kg(ritmo)} comiendo lo que toca: para ganar músculo conviene subir un poco.`);
    if (ritmo > 0.6) return r(-100, `Subes a ${kg(ritmo)}: algo rápido, puede ser más grasa que músculo.`);
  } else if (objetivo === "perder") {
    if (ritmo > -0.2 && cumplidos >= 0.7) return r(-150, `Tu peso va a ${kg(ritmo)} cumpliendo el objetivo: para perder grasa hay que bajar un poco.`);
    if (ritmo < -1) return r(150, `Bajas a ${kg(ritmo)}: demasiado rápido, puedes perder músculo.`);
  } else if (Math.abs(ritmo) > 0.3 && cumplidos >= 0.7) {
    return r(ritmo > 0 ? -100 : 100, `Para mantener, tu peso debería estar estable y va a ${kg(ritmo)}.`);
  }
  return null;
}
