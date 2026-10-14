"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CupSoda, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { totales } from "@/lib/app/dieta";
import { anadirRecetaADieta, quitarComidaAnadida } from "@/lib/app/recetas";
import { useRecetas } from "@/lib/db/hooks";
import type { Comida, Receta } from "@/lib/db/types";
import { toque } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export function resumenReceta(r: Receta) {
  const t = totales([{ items: r.items } as Comida]);
  return { kcal: Math.round(t.kcal), proteinas: Math.round(t.proteinas) };
}

/** Añade la receta al día y ofrece deshacer en el aviso. */
export async function anadirConDeshacer(r: Receta, fecha: string) {
  const comidaId = await anadirRecetaADieta(r, fecha);
  toque(15);
  toast.success(`${r.nombre} añadido`, {
    action: { label: "Deshacer", onClick: () => void quitarComidaAnadida(comidaId, r.id) },
  });
}

/** Fila de batidos guardados en la pantalla de Dieta: un toque y queda registrado. */
export function BatidosRapidos({ fecha }: { fecha: string }) {
  const recetas = useRecetas();
  const [recien, setRecien] = useState<string | null>(null);
  if (!recetas) return null;

  async function anadir(r: Receta) {
    if (recien === r.id) return;
    setRecien(r.id);
    await anadirConDeshacer(r, fecha);
    setTimeout(() => setRecien((x) => (x === r.id ? null : x)), 1400);
  }

  return (
    <section className="space-y-2" aria-label="Tus batidos">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-2xl tracking-wide">Tus batidos</h2>
        <Link href="/dieta/batidos/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          {recetas.length ? "Gestionar" : ""}
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {recetas.map((r) => {
          const { kcal, proteinas } = resumenReceta(r);
          const hecho = recien === r.id;
          return (
            <li key={r.id} className="snap-start">
              <button
                type="button"
                onClick={() => anadir(r)}
                aria-label={`Añadir ${r.nombre}: ${kcal} kcal, ${proteinas} g de proteína`}
                className={cn(
                  "flex min-h-[4.5rem] w-44 items-center gap-2.5 rounded-[1rem_0.45rem_1.1rem_0.5rem] border px-3 py-2 text-left transition-colors",
                  hecho ? "border-lime/50 bg-lime/10" : "border-border bg-secondary/50",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium leading-tight">{r.nombre}</span>
                  <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                    {kcal} kcal · {proteinas} g prot.
                  </span>
                </span>
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    hecho ? "bg-lime/20 text-lime" : "bg-primary/15 text-primary",
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={hecho ? "ok" : "mas"}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      {hecho ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </button>
            </li>
          );
        })}
        <li className="snap-start">
          <Link
            href="/dieta/batidos/editar/"
            className="flex h-full min-h-[4.5rem] w-44 items-center gap-2.5 rounded-[1rem_0.45rem_1.1rem_0.5rem] border border-dashed border-primary/50 px-3 text-sm text-primary"
          >
            <CupSoda className="size-5 shrink-0" aria-hidden />
            {recetas.length ? "Crear otro batido" : "Crea tu primer batido"}
          </Link>
        </li>
      </ul>
    </section>
  );
}
