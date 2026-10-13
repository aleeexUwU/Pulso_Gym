"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { aISO, hoyISO } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";

const TIPOS = [
  { tipo: "gimnasio", color: "bg-primary", nombre: "Gimnasio" },
  { tipo: "abdominales", color: "bg-lime", nombre: "Core" },
  { tipo: "brazo", color: "bg-violet", nombre: "Brazo izq." },
] as const;

/** Calendario mensual unificado con un punto por tipo de sesión completada. */
export function Calendario({
  hechas,
  tipos = ["gimnasio", "abdominales", "brazo"],
  onDia,
}: {
  hechas: Set<string>;
  tipos?: string[];
  onDia?: (fecha: string) => void;
}) {
  const hoy = hoyISO();
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const offset = (primero.getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: diasMes }, (_, i) => aISO(new Date(mes.getFullYear(), mes.getMonth(), i + 1))),
  ];
  const visibles = TIPOS.filter((t) => tipos.includes(t.tipo));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon-lg" aria-label="Mes anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
          <ChevronLeft />
        </Button>
        <p className="font-heading capitalize text-xl tracking-wide">
          {mes.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </p>
        <Button variant="ghost" size="icon-lg" aria-label="Mes siguiente" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {celdas.map((f, i) =>
          f ? (
            <button
              key={f}
              type="button"
              onClick={() => onDia?.(f)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-xs tabular-nums",
                f === hoy ? "bg-primary/15 font-bold text-primary neon-border" : "bg-secondary/40",
              )}
              aria-label={`${f}: ${visibles.filter((t) => hechas.has(`${f}|${t.tipo}`)).map((t) => t.nombre).join(", ") || "sin actividad"}`}
            >
              {Number(f.slice(8))}
              <span className="flex h-1.5 gap-0.5">
                {visibles.map((t) =>
                  hechas.has(`${f}|${t.tipo}`) ? <span key={t.tipo} className={cn("size-1.5 rounded-full", t.color)} /> : null,
                )}
              </span>
            </button>
          ) : (
            <span key={`v${i}`} />
          ),
        )}
      </div>
      {visibles.length > 1 && (
        <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
          {visibles.map((t) => (
            <span key={t.tipo} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", t.color)} /> {t.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
