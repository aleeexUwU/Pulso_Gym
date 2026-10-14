"use client";

import { Plus, RefreshCw, Utensils } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Glass, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { guardarComida, tipoPorHora } from "@/lib/app/dieta";
import { borrar, nuevoId } from "@/lib/db/repo";
import type { Receta } from "@/lib/db/types";
import { comidasRestantes, completarDia, type Falta } from "@/lib/domain/nutrition/completar";
import { toque } from "@/lib/haptics";
import { IdeasNevera } from "./ideas-nevera";

const POR_PAGINA = 3;

/** "¿Qué como para completar el día?": snacks o cenas que encajan con lo que falta hoy. */
export function CompletarDia({
  falta,
  fecha,
  recetas,
  limitaciones,
}: {
  falta: Falta;
  fecha: string;
  recetas: Receta[];
  limitaciones?: string;
}) {
  const [pagina, setPagina] = useState(0);
  const ahora = new Date();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const restantes = comidasRestantes(hora);
  const todas = completarDia(falta, hora, recetas, POR_PAGINA * 3);
  if (todas.length === 0) return null;
  // Objetivo de la próxima comida (lo que falta repartido entre las que quedan).
  const meta: Falta = {
    kcal: Math.max(0, falta.kcal) / restantes,
    proteinas: Math.max(0, falta.proteinas) / restantes,
    carbohidratos: Math.max(0, falta.carbohidratos) / restantes,
    grasas: Math.max(0, falta.grasas) / restantes,
  };
  const paginas = Math.ceil(todas.length / POR_PAGINA);
  const visibles = todas.slice((pagina % paginas) * POR_PAGINA, (pagina % paginas) * POR_PAGINA + POR_PAGINA);
  const n = (x: number) => Math.round(x);

  async function anadir(nombre: string, items: (typeof todas)[number]["items"]) {
    const id = nuevoId();
    const d = new Date();
    await guardarComida({
      id,
      fecha,
      hora: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      tipo: tipoPorHora(d.getHours() + d.getMinutes() / 60),
      descripcion: nombre,
      items,
      fuente: "manual",
    });
    toque(15);
    toast.success(`${nombre} añadido`, { action: { label: "Deshacer", onClick: () => void borrar("comidas", id) } });
  }

  return (
    <Glass className="space-y-3">
      <SectionTitle
        accion={
          paginas > 1 ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setPagina((p) => p + 1)}>
              <RefreshCw /> Otras ideas
            </Button>
          ) : undefined
        }
      >
        <span className="flex items-center gap-2">
          <Utensils className="size-5 text-primary" /> ¿Qué como?
        </span>
      </SectionTitle>
      <p className="-mt-2 text-sm text-muted-foreground">
        Te faltan <strong className="text-foreground">{n(Math.max(0, falta.kcal))} kcal</strong> y{" "}
        <strong className="text-foreground">{n(Math.max(0, falta.proteinas))} g de proteína</strong>
        {restantes > 1 ? ` en unas ${restantes} comidas. Para la próxima:` : ". Esto lo cuadra:"}
      </p>
      <ul className="space-y-2">
        {visibles.map((p) => (
          <li key={p.nombre} className="space-y-1.5 rounded-2xl bg-secondary/50 p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{p.nombre}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {p.momento === "snack" ? "Snack" : "Comida / cena"} · {n(p.total.kcal)} kcal · P {n(p.total.proteinas)} · C {n(p.total.carbohidratos)} · G {n(p.total.grasas)}
                </p>
              </div>
              <Button size="sm" className="shrink-0 rounded-xl" onClick={() => anadir(p.nombre, p.items)}>
                <Plus /> Añadir
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{p.items.map((i) => `${i.nombre} ${i.gramos} g`).join(" · ")}</p>
            <p className="text-[11px] text-muted-foreground">
              Después te quedarían en el día {p.despues.kcal >= 0 ? `${p.despues.kcal} kcal` : `${-p.despues.kcal} kcal de más`} y{" "}
              {p.despues.proteinas > 0 ? `${p.despues.proteinas} g de proteína` : "la proteína cubierta"}.
            </p>
          </li>
        ))}
      </ul>
      <IdeasNevera objetivo={meta} momento={meta.kcal >= 400 ? "comida" : "snack"} limitaciones={limitaciones} onAnadir={anadir} />
    </Glass>
  );
}
