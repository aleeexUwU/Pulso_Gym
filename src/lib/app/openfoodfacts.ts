import type { Nutrientes } from "@/lib/domain/nutrition/alimentos";

/**
 * Open Food Facts: base de datos abierta de productos envasados (licencia ODbL).
 * API pública, gratuita y sin clave. Se consulta directamente desde el móvil.
 */

export interface ProductoOFF {
  codigo: string;
  nombre: string;
  marca: string;
  imagen?: string;
  /** Nutrientes por 100 g / 100 ml. */
  por100: Nutrientes;
  /** Gramos de una ración según la etiqueta (si la indica). */
  racionG: number | null;
  racionTexto: string | null;
}

type Nutriments = Record<string, number | string | undefined>;

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);

/** Convierte la respuesta de Open Food Facts en nuestro formato (puro, testeable). */
export function productoDesdeOFF(codigo: string, p: Record<string, unknown>): ProductoOFF | null {
  const n = (p.nutriments ?? {}) as Nutriments;
  const kcal = num(n["energy-kcal_100g"]) || num(n["energy_100g"]) / 4.184;
  if (!kcal && !num(n.proteins_100g) && !num(n.carbohydrates_100g)) return null;
  const racion = num(p.serving_quantity);
  return {
    codigo,
    nombre: String(p.product_name_es || p.product_name || "Producto sin nombre"),
    marca: String(p.brands ?? "").split(",")[0].trim(),
    imagen: typeof p.image_front_small_url === "string" ? p.image_front_small_url : undefined,
    por100: {
      kcal,
      proteinas: num(n.proteins_100g),
      carbohidratos: num(n.carbohydrates_100g),
      grasas: num(n.fat_100g),
      fibra: num(n.fiber_100g),
      azucares: num(n.sugars_100g),
      sal: num(n.salt_100g) || num(n.sodium_100g) * 2.5,
    },
    racionG: racion > 0 ? racion : null,
    racionTexto: typeof p.serving_size === "string" ? p.serving_size : null,
  };
}

export async function buscarPorCodigo(codigo: string): Promise<ProductoOFF | null> {
  const limpio = codigo.replace(/\D/g, "");
  if (limpio.length < 6) throw new Error("Código de barras no válido.");
  const campos = "product_name,product_name_es,brands,nutriments,serving_quantity,serving_size,image_front_small_url";
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${limpio}.json?fields=${campos}&lc=es`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Open Food Facts no responde ahora mismo.");
  const j = (await res.json()) as { status: number; product?: Record<string, unknown> };
  if (j.status !== 1 || !j.product) return null;
  return productoDesdeOFF(limpio, j.product);
}
