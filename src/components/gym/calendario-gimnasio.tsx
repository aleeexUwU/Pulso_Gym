"use client";

import { Activity, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AbsSession, Workout } from "@/lib/db/types";
import { aISO, deISO, formatoFecha } from "@/lib/domain/dates";
import { ejercicio } from "@/lib/domain/exercises";
import { cn } from "@/lib/utils";

const INICIALES = ["L", "M", "X", "J", "V", "S", "D"];

function celdasMes(anio: number, mes: number): (string | null)[] {
  const hueco = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const dias = new Date(anio, mes + 1, 0).getDate();
  return [...Array<null>(hueco).fill(null), ...Array.from({ length: dias }, (_, i) => aISO(new Date(anio, mes, i + 1)))];
}

/** "3 × 10 · 25 kg" a partir de las series hechas de un ejercicio. */
function resumenSeries(series: Workout["ejercicios"][number]["series"]): string {
  const hechas = series.filter((s) => s.hecho);
  if (hechas.length === 0) return "sin series hechas";
  const reps = hechas.map((s) => s.reps ?? 0);
  const pesos = hechas.map((s) => s.pesoKg).filter((p): p is number => p != null && p > 0);
  const mismasReps = reps.every((r) => r === reps[0]);
  const txtReps = mismasReps ? `${hechas.length} × ${reps[0]}` : `${hechas.length} series (${reps.join("-")})`;
  if (pesos.length === 0) return txtReps;
  const max = Math.max(...pesos);
  const min = Math.min(...pesos);
  return `${txtReps} · ${min === max ? `${max} kg` : `${min}-${max} kg`}`;
}

/**
 * Calendario de entrenos: días con gimnasio (pesa) y con core (pulso). Al tocar un
 * día se ven sus sesiones con las series hechas y un enlace al resumen completo.
 */
export function CalendarioGimnasio({
  abierto,
  onOpenChange,
  workouts,
  abs,
  hoy,
}: {
  abierto: boolean;
  onOpenChange: (a: boolean) => void;
  workouts: Workout[];
  abs: AbsSession[];
  hoy: string;
}) {
  const [mes, setMes] = useState(() => {
    const d = deISO(hoy);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });
  const [dia, setDia] = useState<string | null>(null);

  const gym = useMemo(() => {
    const m = new Map<string, Workout[]>();
    for (const w of workouts) if (w.estado === "completado") m.set(w.fecha, [...(m.get(w.fecha) ?? []), w]);
    return m;
  }, [workouts]);
  const core = useMemo(() => new Map(abs.filter((a) => a.completado).map((a) => [a.fecha, a])), [abs]);

  const celdas = celdasMes(mes.anio, mes.mes);
  const titulo = new Date(mes.anio, mes.mes, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const delMes = celdas.filter((f): f is string => !!f);
  const nGym = delMes.filter((f) => gym.has(f)).length;
  const nCore = delMes.filter((f) => core.has(f)).length;
  const claveMes = `${mes.anio}-${String(mes.mes + 1).padStart(2, "0")}`;
  const mover = (n: number) => {
    setDia(null);
    setMes(({ anio, mes: m }) => ({ anio: anio + Math.floor((m + n) / 12), mes: (((m + n) % 12) + 12) % 12 }));
  };

  const sesionesDia = dia ? (gym.get(dia) ?? []) : [];
  const coreDia = dia ? core.get(dia) : undefined;

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:mx-auto lg:max-w-lg">
        <SheetHeader className="px-0">
          <SheetTitle className="font-heading text-2xl tracking-wide">Historial de entrenos</SheetTitle>
          <SheetDescription>Toca un día para ver qué hiciste.</SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon-lg" aria-label="Mes anterior" onClick={() => mover(-1)}>
            <ChevronLeft />
          </Button>
          <p className="font-heading text-xl capitalize tracking-wide">{titulo}</p>
          <Button variant="ghost" size="icon-lg" aria-label="Mes siguiente" disabled={claveMes >= hoy.slice(0, 7)} onClick={() => mover(1)}>
            <ChevronRight />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {INICIALES.map((d) => (
            <span key={d} className="pb-1 text-xs text-muted-foreground" aria-hidden>
              {d}
            </span>
          ))}
          {celdas.map((f, i) => {
            if (!f) return <span key={`h${i}`} aria-hidden />;
            const g = gym.has(f);
            const c = core.has(f);
            const n = Number(f.slice(8));
            return (
              <button
                key={f}
                type="button"
                disabled={f > hoy}
                onClick={() => setDia(f === dia ? null : f)}
                aria-label={`${n}: ${[g && "gimnasio", c && "core"].filter(Boolean).join(" y ") || "sin entreno"}`}
                aria-pressed={f === dia}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors disabled:opacity-30",
                  f === dia ? "border-primary bg-primary/15 text-primary" : g ? "border-primary/40 bg-primary/10" : c ? "border-border bg-secondary/60" : "border-transparent",
                  f === hoy && f !== dia && "border-foreground/40",
                )}
              >
                <span className={cn("leading-none", (g || c) && "font-semibold")}>{n}</span>
                {(g || c) && (
                  <span className="flex gap-0.5" aria-hidden>
                    {g && <Dumbbell className="size-3 text-primary" />}
                    {c && <Activity className="size-3 text-lime" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Dumbbell className="size-3.5 text-primary" /> gimnasio ({nGym})
          </span>
          <span className="flex items-center gap-1">
            <Activity className="size-3.5 text-lime" /> core ({nCore})
          </span>
        </div>

        {dia && (
          <section className="space-y-3 rounded-2xl bg-secondary/50 p-3" aria-live="polite">
            <h3 className="font-heading text-xl capitalize tracking-wide">{formatoFecha(dia, { weekday: "long", day: "numeric", month: "long" })}</h3>
            {sesionesDia.length === 0 && !coreDia && <p className="text-sm text-muted-foreground">No entrenaste este día.</p>}
            {sesionesDia.map((w) => {
              const minutos = w.fin ? Math.round((Date.parse(w.fin) - Date.parse(w.inicio)) / 60000) : null;
              const hechas = w.ejercicios.filter((e) => e.series.some((s) => s.hecho));
              return (
                <div key={w.id} className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Dumbbell className="size-4 text-primary" aria-hidden /> {w.nombre}
                    {minutos != null && <span className="font-normal text-muted-foreground">· {minutos} min</span>}
                  </p>
                  <ul className="space-y-1 text-sm">
                    {hechas.map((e, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="min-w-0 truncate">{ejercicio(e.exerciseId).nombre}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{resumenSeries(e.series)}</span>
                      </li>
                    ))}
                  </ul>
                  {w.notas && <p className="rounded-xl bg-background/60 p-2 text-xs text-muted-foreground">{w.notas}</p>}
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href={`/gimnasio/sesion/?id=${w.id}`}>Ver resumen y notas</Link>
                  </Button>
                </div>
              );
            })}
            {coreDia && (
              <p className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-lime" aria-hidden /> Core hecho
                {coreDia.duracionSeg > 0 && <span className="text-muted-foreground">· {Math.round(coreDia.duracionSeg / 60)} min</span>}
              </p>
            )}
          </section>
        )}
      </SheetContent>
    </Sheet>
  );
}
