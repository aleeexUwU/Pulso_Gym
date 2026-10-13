import { ALIMENTOS, nutrientesDe, type Alimento, type Nutrientes } from "./alimentos";

/** Un alimento de una comida, con sus nutrientes ya calculados para la cantidad. */
export interface ItemComida extends Nutrientes {
  nombre: string;
  gramos: number;
  /** Id de la tabla local si sale de ella (permite recalcular al cambiar los gramos). */
  alimentoId?: string;
  /** Nutrientes por 100 g para recalcular al editar la cantidad. */
  por100?: Nutrientes;
  confianza: "alta" | "media" | "baja";
}

export interface ResultadoAnalisis {
  items: ItemComida[];
  /** Trozos del texto que no se reconocieron (para añadirlos a mano). */
  sinReconocer: string[];
}

export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NUMEROS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  "un par de": 2,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  medio: 0.5,
  media: 0.5,
};

type Unidad =
  | "g"
  | "ml"
  | "kg"
  | "l"
  | "cucharada"
  | "cucharadita"
  | "vaso"
  | "taza"
  | "racion"
  | "loncha"
  | "rebanada"
  | "lata"
  | "punado"
  | "onza"
  | "scoop"
  | "unidad";

const UNIDADES: [RegExp, Unidad][] = [
  [/^(g|gr|grs|gramos?)$/, "g"],
  [/^(ml|mililitros?)$/, "ml"],
  [/^(kg|kilos?)$/, "kg"],
  [/^(l|litros?)$/, "l"],
  [/^cucharadas?$/, "cucharada"],
  [/^cucharaditas?$/, "cucharadita"],
  [/^vasos?$/, "vaso"],
  [/^tazas?$/, "taza"],
  [/^(platos?|raciones|racion|porcion(es)?|cuencos?|boles?)$/, "racion"],
  [/^lonchas?$/, "loncha"],
  [/^rebanadas?$/, "rebanada"],
  [/^latas?$/, "lata"],
  [/^punados?$/, "punado"],
  [/^onzas?$/, "onza"],
  [/^(scoops?|cacitos?|cazos?)$/, "scoop"],
  [/^(piezas?|unidades|unidad)$/, "unidad"],
];

const PATRON_UNIDAD =
  "g|gr|grs|gramos?|ml|mililitros?|kg|kilos?|l|litros?|cucharadas?|cucharaditas?|vasos?|tazas?|platos?|raciones|racion|porcion(?:es)?|cuencos?|boles?|lonchas?|rebanadas?|latas?|punados?|onzas?|scoops?|cacitos?|cazos?|piezas?|unidades|unidad";
const PATRON_NUMERO = `\\d+(?:[.,]\\d+)?|un par de|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|medio|media`;
/** Cantidad justo antes del alimento: "200 g de", "2", "un plato de", "media"... */
const CANTIDAD = new RegExp(`(?:^|[\\s,;+(])(${PATRON_NUMERO})?\\s*(${PATRON_UNIDAD})?\\s*(?:de\\s+)?$`);

function unidadDe(txt: string | undefined): Unidad | null {
  if (!txt) return null;
  for (const [re, u] of UNIDADES) if (re.test(txt)) return u;
  return null;
}

function numeroDe(txt: string | undefined): number | null {
  if (!txt) return null;
  if (/^\d/.test(txt)) return Number(txt.replace(",", "."));
  return NUMEROS[txt] ?? null;
}

/** Gramos para una cantidad y unidad de un alimento concreto. */
export function gramosPara(a: Alimento, cantidad: number | null, unidad: Unidad | null): number {
  const n = cantidad ?? 1;
  switch (unidad) {
    case "g":
    case "ml":
      return n;
    case "kg":
    case "l":
      return n * 1000;
    case "cucharada":
      return n * (a.id === "aceite_oliva" ? 10 : 15);
    case "cucharadita":
      return n * 5;
    case "vaso":
    case "taza":
      return n * 250;
    case "racion":
      return n * a.racion;
    case "loncha":
      return n * 15;
    case "rebanada":
      return n * 30;
    case "lata":
      return n * (a.unidad ?? 80);
    case "punado":
      return n * 30;
    case "onza":
      return n * 5;
    case "scoop":
      return n * 30;
    case "unidad":
      return n * (a.unidad ?? a.racion);
    default:
      // Sin unidad: "2 huevos" → 2 unidades; "arroz" → una ración.
      return cantidad == null ? (a.unidad ?? a.racion) : n * (a.unidad ?? a.racion);
  }
}

const ALIAS = ALIMENTOS.flatMap((a) => a.alias.map((al) => ({ alias: normalizar(al), alimento: a }))).sort(
  (x, y) => y.alias.length - x.alias.length,
);

function redondear(n: Nutrientes): Nutrientes {
  const r = (x: number) => Math.round(x * 10) / 10;
  return {
    kcal: Math.round(n.kcal),
    proteinas: r(n.proteinas),
    carbohidratos: r(n.carbohidratos),
    grasas: r(n.grasas),
    fibra: r(n.fibra),
    azucares: r(n.azucares),
    sal: Math.round(n.sal * 100) / 100,
  };
}

export function itemDeAlimento(a: Alimento, gramos: number, confianza: ItemComida["confianza"] = "media"): ItemComida {
  const g = Math.max(1, Math.round(gramos));
  const { id, nombre, kcal, proteinas, carbohidratos, grasas, fibra, azucares, sal } = a;
  const por100 = { kcal, proteinas, carbohidratos, grasas, fibra, azucares, sal };
  return { nombre, gramos: g, alimentoId: id, por100, confianza, ...redondear(nutrientesDe(por100, g)) };
}

/** Recalcula un item al cambiar los gramos (proporcional a sus nutrientes por 100 g). */
export function cambiarGramos(it: ItemComida, gramos: number): ItemComida {
  const g = Math.max(1, Math.round(gramos));
  const base = it.por100 ?? (it.gramos > 0 ? nutrientesDe(it, (100 / it.gramos) * 100) : it);
  return { ...it, gramos: g, por100: base, ...redondear(nutrientesDe(base, g)) };
}

const RELLENO = /^(?:y|con|de|el|la|los|las|mi|un|una|unos|unas|al|a|en|para|del|desayuno|comida|cena|merienda|almuerzo|he|comido|tomado|bebido|me|he tomado|hoy|un poco)$/;

/**
 * Interpreta lo que escribes ("2 huevos, una tostada con aceite y un café con
 * leche") con la tabla local. Sin conexión y sin IA: cantidades aproximadas.
 */
export function analizarTexto(texto: string): ResultadoAnalisis {
  const t = normalizar(texto);
  const ocupado: boolean[] = new Array(t.length).fill(false);
  const encontrados: { inicio: number; fin: number; alimento: Alimento }[] = [];

  for (const { alias, alimento } of ALIAS) {
    const re = new RegExp(`(?<![a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "g");
    for (const m of t.matchAll(re)) {
      const ini = m.index!;
      const fin = ini + alias.length;
      if (ocupado.slice(ini, fin).some(Boolean)) continue;
      for (let i = ini; i < fin; i++) ocupado[i] = true;
      encontrados.push({ inicio: ini, fin, alimento });
    }
  }
  encontrados.sort((a, b) => a.inicio - b.inicio);

  const items: ItemComida[] = [];
  let finAnterior = 0;
  for (const e of encontrados) {
    const antes = t.slice(finAnterior, e.inicio);
    const m = antes.match(CANTIDAD);
    const cantidad = numeroDe(m?.[1]);
    const unidad = unidadDe(m?.[2]);
    // Marcar la cantidad como usada para no dejarla como "sin reconocer".
    if (m && (m[1] || m[2])) {
      const desde = e.inicio - m[0].length;
      for (let i = Math.max(0, desde); i < e.inicio; i++) ocupado[i] = true;
    }
    const gramos = gramosPara(e.alimento, cantidad, unidad);
    items.push(itemDeAlimento(e.alimento, gramos, cantidad != null || unidad != null ? "media" : "baja"));
    finAnterior = e.fin;
  }

  const sobrante = t
    .split("")
    .map((c, i) => (ocupado[i] ? " " : c))
    .join("")
    .split(/[,;+\n.]| y | con /)
    .map((s) => s.trim())
    .map((s) =>
      s
        .split(" ")
        .filter((w) => w && !RELLENO.test(w) && !/^\d+([.,]\d+)?$/.test(w))
        .join(" "),
    )
    .filter((s) => s.length >= 3);

  return { items, sinReconocer: sobrante };
}
