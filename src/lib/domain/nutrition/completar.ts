import { ALIMENTOS, sumarNutrientes, type Nutrientes } from "./alimentos";
import { itemDeAlimento, type ItemComida } from "./parser";

/**
 * "¿Qué como para completar el día?": propone snacks o comidas con cantidades
 * concretas que encajan con lo que te falta (sobre todo proteína y calorías).
 * Todo con la tabla de alimentos local: funciona sin conexión y sin IA.
 */

export type Momento = "snack" | "comida";

interface Plantilla {
  nombre: string;
  momento: Momento;
  /** [id de alimento, gramos de la ración base]. */
  items: [string, number][];
}

const PLANTILLAS: Plantilla[] = [
  // Snacks
  { nombre: "Yogur proteico con plátano", momento: "snack", items: [["yogur_proteico", 150], ["platano", 120]] },
  { nombre: "Queso batido con avena y fresas", momento: "snack", items: [["queso_batido", 250], ["avena", 30], ["fresas", 100]] },
  { nombre: "Batido de proteína con leche", momento: "snack", items: [["whey", 30], ["leche_semi", 300]] },
  { nombre: "Tostadas integrales con pavo", momento: "snack", items: [["pan_integral", 60], ["fiambre_pavo", 60]] },
  { nombre: "Atún con tortitas de arroz", momento: "snack", items: [["atun_lata", 60], ["tortita_maiz", 30]] },
  { nombre: "Frutos secos con manzana", momento: "snack", items: [["frutos_secos", 30], ["manzana", 180]] },
  { nombre: "Huevos cocidos con pan", momento: "snack", items: [["huevo", 120], ["pan_integral", 30]] },
  { nombre: "Tostada con crema de cacahuete y plátano", momento: "snack", items: [["pan_integral", 60], ["crema_cacahuete", 20], ["platano", 120]] },
  // Comidas y cenas
  { nombre: "Pollo con arroz y verduras", momento: "comida", items: [["pollo_pechuga", 150], ["arroz_cocido", 180], ["verduras", 150], ["aceite_oliva", 10]] },
  { nombre: "Salmón con patata y ensalada", momento: "comida", items: [["salmon", 150], ["patata_cocida", 200], ["ensalada", 100], ["aceite_oliva", 5]] },
  { nombre: "Tortilla de huevos y claras con pan y tomate", momento: "comida", items: [["huevo", 120], ["clara", 66], ["pan_integral", 60], ["tomate", 150], ["aceite_oliva", 5]] },
  { nombre: "Merluza con boniato y verduras", momento: "comida", items: [["merluza", 200], ["boniato", 200], ["verduras", 150], ["aceite_oliva", 10]] },
  { nombre: "Ternera con quinoa y verduras", momento: "comida", items: [["ternera", 150], ["quinoa", 150], ["verduras", 150], ["aceite_oliva", 10]] },
  { nombre: "Pavo con cuscús y ensalada", momento: "comida", items: [["pavo", 150], ["cuscus", 150], ["ensalada", 100], ["aceite_oliva", 10]] },
  { nombre: "Ensalada de garbanzos con atún", momento: "comida", items: [["garbanzos", 150], ["atun_lata", 80], ["tomate", 150], ["aceite_oliva", 10]] },
  { nombre: "Tofu salteado con arroz", momento: "comida", items: [["tofu", 150], ["arroz_cocido", 150], ["verduras", 150], ["aceite_oliva", 10]] },
  { nombre: "Pasta con pollo y tomate", momento: "comida", items: [["pasta_cocida", 200], ["pollo_pechuga", 120], ["tomate", 100], ["aceite_oliva", 10]] },
  { nombre: "Lentejas con pan", momento: "comida", items: [["lentejas", 350], ["pan_integral", 30]] },
];

export interface Falta {
  kcal: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface Propuesta {
  nombre: string;
  momento: Momento;
  items: ItemComida[];
  total: Nutrientes;
  /** Lo que quedaría por cubrir en el día (negativo = te pasarías). */
  despues: Falta;
}

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

/** Redondea gramos: a unidades enteras si el alimento se cuenta (huevos...), si no a 5 g. */
function redondear(id: string, g: number): number {
  const a = POR_ID.get(id);
  if (a?.unidad) return Math.max(a.unidad, Math.round(g / a.unidad) * a.unidad);
  return Math.max(5, Math.round(g / 5) * 5);
}

function construir(nombre: string, momento: Momento, items: ItemComida[], falta: Falta): Propuesta {
  const total = sumarNutrientes(...items);
  return {
    nombre,
    momento,
    items,
    total,
    despues: {
      kcal: Math.round(falta.kcal - total.kcal),
      proteinas: Math.round(falta.proteinas - total.proteinas),
      carbohidratos: Math.round(falta.carbohidratos - total.carbohidratos),
      grasas: Math.round(falta.grasas - total.grasas),
    },
  };
}

/** Comidas que suelen quedar en el día a esa hora (para no cargarlo todo en una). */
export function comidasRestantes(hora: number): number {
  if (hora < 11) return 4;
  if (hora < 14) return 3;
  if (hora < 18) return 2;
  return 1;
}

/** Error de encaje respecto al objetivo de ESTA comida: pesa más la proteína y pasarse. */
function error(p: Propuesta, falta: Falta): number {
  const d = {
    kcal: falta.kcal - p.total.kcal,
    proteinas: falta.proteinas - p.total.proteinas,
    carbohidratos: falta.carbohidratos - p.total.carbohidratos,
    grasas: falta.grasas - p.total.grasas,
  };
  const pasarse = Math.max(0, -d.kcal) / Math.max(falta.kcal, 150);
  return (
    (2 * Math.abs(d.proteinas)) / Math.max(falta.proteinas, 15) +
    Math.abs(d.kcal) / Math.max(falta.kcal, 150) +
    2 * pasarse +
    (0.4 * Math.abs(d.carbohidratos)) / Math.max(falta.carbohidratos, 30) +
    (0.4 * Math.abs(d.grasas)) / Math.max(falta.grasas, 10)
  );
}

/**
 * Propuestas ordenadas por lo bien que cuadran. Con poco que cubrir solo snacks; con
 * mucho (o a partir de las 19 h con más de ~450 kcal) comidas/cenas primero.
 * `recetas` = batidos y recetas guardados (se ofrecen tal cual, sin escalar).
 */
export function completarDia(
  falta: Falta,
  hora: number,
  recetas: { nombre: string; items: ItemComida[] }[] = [],
  cuantas = 3,
): Propuesta[] {
  const f: Falta = {
    kcal: Math.max(0, falta.kcal),
    proteinas: Math.max(0, falta.proteinas),
    carbohidratos: Math.max(0, falta.carbohidratos),
    grasas: Math.max(0, falta.grasas),
  };
  if (f.kcal < 120 && f.proteinas < 10) return [];
  // Objetivo de la próxima comida: lo que falta repartido entre las que quedan.
  const n = comidasRestantes(hora);
  const meta: Falta = { kcal: f.kcal / n, proteinas: f.proteinas / n, carbohidratos: f.carbohidratos / n, grasas: f.grasas / n };
  const quiereComida = meta.kcal >= 400;

  const candidatas: Propuesta[] = [];
  for (const pl of PLANTILLAS) {
    if (pl.momento === "comida" && !quiereComida) continue;
    const base = pl.items.map(([id, g]) => itemDeAlimento(POR_ID.get(id)!, g));
    const kBase = sumarNutrientes(...base).kcal;
    // Se escala la ración para acercarse a las calorías que faltan (dentro de un margen razonable).
    const [min, max] = pl.momento === "snack" ? [0.6, 1.5] : [0.7, 1.6];
    let mejor: Propuesta | null = null;
    for (let k = min; k <= max + 1e-9; k += 0.1) {
      const items = pl.items.map(([id, g]) => itemDeAlimento(POR_ID.get(id)!, redondear(id, g * k)));
      const p = construir(pl.nombre, pl.momento, items, f);
      if (!mejor || error(p, meta) < error(mejor, meta)) mejor = p;
    }
    if (mejor && kBase > 0) candidatas.push(mejor);
  }
  for (const r of recetas) {
    if (r.items.length) candidatas.push(construir(r.nombre, "snack", r.items, f));
  }
  return candidatas
    .sort((a, b) => error(a, meta) - error(b, meta) || Number(b.momento === "comida" && quiereComida) - Number(a.momento === "comida" && quiereComida))
    .slice(0, cuantas);
}
