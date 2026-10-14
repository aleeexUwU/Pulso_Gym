"use client";

import { Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Glass, SectionTitle, Stepper } from "@/components/ui-kit";
import { ALIMENTOS } from "@/lib/domain/nutrition/alimentos";
import { cambiarGramos, itemDeAlimento, normalizar, type ItemComida } from "@/lib/domain/nutrition/parser";

/** Lista editable de alimentos (nombre, gramos, quitar) con buscador en la tabla local. */
export function ListaAlimentos({
  items,
  setItems,
  notasIA,
  titulo = "Alimentos",
  vacio = "Aún no hay alimentos. Analiza, busca o añade a mano.",
}: {
  items: ItemComida[];
  setItems: (f: (xs: ItemComida[]) => ItemComida[]) => void;
  notasIA?: string;
  titulo?: string;
  vacio?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const resultados = useMemo(() => {
    const q = normalizar(busqueda);
    if (q.length < 2) return [];
    return ALIMENTOS.filter((a) => normalizar(a.nombre).includes(q) || a.alias.some((al) => normalizar(al).includes(q))).slice(0, 6);
  }, [busqueda]);

  return (
    <Glass className="space-y-3">
      <SectionTitle>
        {titulo} ({items.length})
      </SectionTitle>
      {notasIA && <p className="rounded-xl bg-violet/10 p-2.5 text-xs leading-relaxed">{notasIA}</p>}
      {items.length === 0 && <p className="text-sm text-muted-foreground">{vacio}</p>}
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="space-y-2 rounded-2xl bg-secondary/50 p-3">
            <div className="flex items-start gap-2">
              <Input
                aria-label="Nombre del alimento"
                value={it.nombre}
                onChange={(e) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, nombre: e.target.value } : x)))}
                className="h-10 flex-1 rounded-xl"
              />
              <Button variant="ghost" size="icon" className="text-destructive" aria-label="Quitar" onClick={() => setItems((xs) => xs.filter((_, k) => k !== i))}>
                <Trash2 />
              </Button>
            </div>
            <Stepper
              etiqueta="Gramos"
              sufijo="g"
              paso={10}
              decimales={0}
              valor={it.gramos}
              onChange={(v) => v != null && v > 0 && setItems((xs) => xs.map((x, k) => (k === i ? cambiarGramos(x, v) : x)))}
            />
            <p className="text-xs tabular-nums text-muted-foreground">
              <strong className="text-foreground">{Math.round(it.kcal)} kcal</strong> · P {it.proteinas} · C {it.carbohidratos} · G {it.grasas} · fibra {it.fibra} g
              {it.confianza === "baja" && " · cantidad estimada, revísala"}
            </p>
          </li>
        ))}
      </ul>
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="sr-only">Buscar alimento</span>
        <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Añadir de la tabla: arroz, pollo, yogur…" className="h-11 rounded-xl pl-9" />
      </label>
      {resultados.length > 0 && (
        <ul className="space-y-1">
          {resultados.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-left text-sm"
                onClick={() => {
                  setItems((xs) => [...xs, itemDeAlimento(a, a.unidad ?? a.racion, "media")]);
                  setBusqueda("");
                }}
              >
                <span>{a.nombre}</span>
                <span className="text-xs text-muted-foreground">{a.kcal} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Glass>
  );
}
