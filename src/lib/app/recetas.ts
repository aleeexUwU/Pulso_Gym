import { guardarComida, tipoPorHora } from "@/lib/app/dieta";
import { borrar, escribirKv, leerKv, nuevoId } from "@/lib/db/repo";
import type { Receta } from "@/lib/db/types";

/**
 * Batidos y recetas guardados. Viven en la clave "recetas" del almacén clave-valor,
 * así se sincronizan con Supabase sin tocar la base de datos.
 */
async function todas(): Promise<Receta[]> {
  return (await leerKv("recetas")) ?? [];
}

export async function guardarReceta(r: Omit<Receta, "id" | "creadaEn" | "usos"> & { id?: string }): Promise<Receta> {
  const lista = await todas();
  const previa = r.id ? lista.find((x) => x.id === r.id) : undefined;
  const receta: Receta = {
    id: previa?.id ?? nuevoId(),
    creadaEn: previa?.creadaEn ?? new Date().toISOString(),
    usos: previa?.usos ?? 0,
    nombre: r.nombre.trim(),
    items: r.items,
  };
  await escribirKv("recetas", previa ? lista.map((x) => (x.id === receta.id ? receta : x)) : [...lista, receta]);
  return receta;
}

export async function borrarReceta(id: string): Promise<void> {
  await escribirKv("recetas", (await todas()).filter((x) => x.id !== id));
}

function ahora(): { hora: string; tipo: ReturnType<typeof tipoPorHora> } {
  const d = new Date();
  return {
    hora: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    tipo: tipoPorHora(d.getHours() + d.getMinutes() / 60),
  };
}

/** Registra la receta como comida del día indicado (a la hora actual). Devuelve el id de la comida. */
export async function anadirRecetaADieta(receta: Receta, fecha: string): Promise<string> {
  const id = nuevoId();
  const { hora, tipo } = ahora();
  await guardarComida({ id, fecha, hora, tipo, descripcion: receta.nombre, items: receta.items, fuente: "receta" });
  const lista = await todas();
  await escribirKv(
    "recetas",
    lista.map((x) => (x.id === receta.id ? { ...x, usos: x.usos + 1 } : x)),
  );
  return id;
}

/** Deshace el "añadir" de un toque. */
export async function quitarComidaAnadida(comidaId: string, recetaId: string): Promise<void> {
  await borrar("comidas", comidaId);
  const lista = await todas();
  await escribirKv(
    "recetas",
    lista.map((x) => (x.id === recetaId ? { ...x, usos: Math.max(0, x.usos - 1) } : x)),
  );
}
