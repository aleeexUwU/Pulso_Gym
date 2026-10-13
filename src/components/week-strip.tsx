"use client";

import { Activity, Dumbbell, Hand } from "lucide-react";
import { diaSemana, hoyISO, NOMBRE_DIA_CORTO, sumarDias } from "@/lib/domain/dates";
import type { ActividadDia } from "@/lib/domain/weekly-plan";
import { cn } from "@/lib/utils";

/** Tira de la semana (lunes a domingo) con lo planificado y lo hecho. */
export function WeekStrip({
  desde,
  actividades,
  hechas,
}: {
  desde: string;
  actividades: ActividadDia[];
  /** claves "fecha|tipo" completadas */
  hechas: Set<string>;
}) {
  const hoy = hoyISO();
  return (
    <ol className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, i) => {
        const f = sumarDias(desde, i);
        const acts = actividades.filter((a) => a.fecha === f);
        const esHoy = f === hoy;
        return (
          <li
            key={f}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl py-2 text-xs",
              esHoy ? "bg-primary/15 neon-border" : "bg-secondary/50",
            )}
            aria-label={`${f}${esHoy ? " (hoy)" : ""}: ${acts.map((a) => a.titulo).join(", ") || "descanso"}`}
          >
            <span className={cn("font-semibold", esHoy && "text-primary")}>{NOMBRE_DIA_CORTO[diaSemana(f)]}</span>
            <span className="text-[10px] text-muted-foreground">{Number(f.slice(8))}</span>
            <span className="flex min-h-4 flex-wrap justify-center gap-0.5">
              {acts.map((a) => {
                const ok = hechas.has(`${f}|${a.tipo}`);
                const Icon = a.tipo === "gimnasio" ? Dumbbell : a.tipo === "abdominales" ? Activity : Hand;
                return (
                  <Icon
                    key={a.tipo}
                    className={cn(
                      "size-3.5",
                      ok ? "text-lime" : a.tipo === "gimnasio" ? "text-primary/70" : "text-muted-foreground/60",
                    )}
                    aria-hidden
                  />
                );
              })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
