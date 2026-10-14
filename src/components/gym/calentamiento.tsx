"use client";

import { Check, Flame } from "lucide-react";
import { useState } from "react";
import type { SerieCalentamiento } from "@/lib/domain/progression";
import { toque } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/**
 * Series de calentamiento sugeridas antes de la primera serie efectiva. Se marcan solo
 * para llevar la cuenta en pantalla: no se guardan ni cuentan para tu progreso.
 */
export function Calentamiento({ series }: { series: SerieCalentamiento[] }) {
  const [hechas, setHechas] = useState<Set<number>>(new Set());
  if (series.length === 0) return null;
  const num = (x: number) => String(x).replace(".", ",");
  return (
    <div className="rounded-2xl border border-dashed border-warn/50 bg-warn/5 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Flame className="size-4 text-warn" aria-hidden /> Calentamiento
        <span className="font-normal text-muted-foreground">· no cuenta para tu progreso</span>
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {series.map((s, i) => {
          const hecha = hechas.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={hecha}
                onClick={() => {
                  toque();
                  setHechas((h) => {
                    const n = new Set(h);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  });
                }}
                className={cn(
                  "boton-tinta flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm tabular-nums",
                  hecha ? "bg-lime/15 text-lime line-through decoration-1" : "bg-secondary",
                )}
              >
                {hecha && <Check className="size-4" aria-hidden />}
                {num(s.pesoKg)} kg × {s.reps}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Descansa 30–60 s entre estas series. Sirven para preparar la articulación y repasar la técnica.</p>
    </div>
  );
}
