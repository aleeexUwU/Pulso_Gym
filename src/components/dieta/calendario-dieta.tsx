"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { totales } from "@/lib/app/dieta";
import type { Comida } from "@/lib/db/types";
import { aISO, deISO } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";

const INICIALES = ["L", "M", "X", "J", "V", "S", "D"];

/** "2026-10" → días del mes con huecos delante para que el 1 caiga en su día (semana de lunes a domingo). */
function celdasMes(anio: number, mes: number): (string | null)[] {
  const primero = new Date(anio, mes, 1);
  const hueco = (primero.getDay() + 6) % 7;
  const dias = new Date(anio, mes + 1, 0).getDate();
  return [...Array<null>(hueco).fill(null), ...Array.from({ length: dias }, (_, i) => aISO(new Date(anio, mes, i + 1)))];
}

/**
 * Calendario de la dieta: cada día muestra las kcal registradas y un punto según
 * el objetivo (y el número, para no depender del color). Al tocar un día se abre.
 */
export function CalendarioDieta({
  abierto,
  onOpenChange,
  comidas,
  fecha,
  hoy,
  objetivoKcal,
  onElegir,
}: {
  abierto: boolean;
  onOpenChange: (a: boolean) => void;
  comidas: Comida[];
  fecha: string;
  hoy: string;
  objetivoKcal: number;
  onElegir: (fecha: string) => void;
}) {
  const [mes, setMes] = useState(() => {
    const d = deISO(fecha);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  // kcal y proteína por día (solo días con algo registrado).
  const porDia = useMemo(() => {
    const m = new Map<string, Comida[]>();
    for (const c of comidas) m.set(c.fecha, [...(m.get(c.fecha) ?? []), c]);
    return new Map([...m].map(([f, cs]) => [f, totales(cs)]));
  }, [comidas]);

  const celdas = celdasMes(mes.anio, mes.mes);
  const titulo = new Date(mes.anio, mes.mes, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const delMes = celdas.filter((f): f is string => !!f && porDia.has(f));
  const media = (k: "kcal" | "proteinas") =>
    delMes.length ? Math.round(delMes.reduce((s, f) => s + porDia.get(f)![k], 0) / delMes.length) : 0;
  const mesActual = hoy.slice(0, 7);
  const claveMes = `${mes.anio}-${String(mes.mes + 1).padStart(2, "0")}`;
  const mover = (n: number) => setMes(({ anio, mes: m }) => ({ anio: anio + Math.floor((m + n) / 12), mes: (((m + n) % 12) + 12) % 12 }));

  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:mx-auto lg:max-w-lg">
        <SheetHeader className="px-0">
          <SheetTitle className="font-heading text-2xl tracking-wide">Calendario</SheetTitle>
          <SheetDescription>Toca un día para ver lo que comiste.</SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon-lg" aria-label="Mes anterior" onClick={() => mover(-1)}>
            <ChevronLeft />
          </Button>
          <p className="font-heading text-xl capitalize tracking-wide">{titulo}</p>
          <Button variant="ghost" size="icon-lg" aria-label="Mes siguiente" disabled={claveMes >= mesActual} onClick={() => mover(1)}>
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
            const t = porDia.get(f);
            const futuro = f > hoy;
            const pct = t && objetivoKcal ? t.kcal / objetivoKcal : 0;
            const estado = !t ? null : pct >= 0.9 && pct <= 1.1 ? "ok" : pct < 0.9 ? "falta" : "alto";
            const dia = Number(f.slice(8));
            return (
              <button
                key={f}
                type="button"
                disabled={futuro}
                onClick={() => {
                  onElegir(f);
                  onOpenChange(false);
                }}
                aria-label={`${dia}: ${t ? `${Math.round(t.kcal)} kcal` : "sin registros"}`}
                aria-current={f === fecha ? "date" : undefined}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-colors disabled:opacity-30",
                  f === fecha ? "border-primary bg-primary/15 text-primary" : t ? "border-border bg-secondary/60" : "border-transparent",
                  f === hoy && f !== fecha && "border-foreground/40",
                )}
              >
                <span className={cn("leading-none", t && "font-semibold")}>{dia}</span>
                {t && (
                  <span className="mt-1 flex items-center gap-0.5 text-[10px] leading-none tabular-nums text-muted-foreground">
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 rounded-full",
                        estado === "ok" ? "bg-lime" : estado === "falta" ? "bg-warn" : "bg-primary",
                      )}
                    />
                    {t.kcal >= 1000 ? `${(t.kcal / 1000).toFixed(1)}k` : Math.round(t.kcal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-lime" /> en objetivo
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-warn" /> por debajo
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> por encima
          </span>
        </div>

        <p className="rounded-2xl bg-secondary/50 p-3 text-sm">
          {delMes.length ? (
            <>
              <strong>{delMes.length}</strong> {delMes.length === 1 ? "día registrado" : "días registrados"} este mes · media{" "}
              <strong>{media("kcal")} kcal</strong> y <strong>{media("proteinas")} g</strong> de proteína.
            </>
          ) : (
            "No hay comidas registradas este mes."
          )}
        </p>

        {fecha !== hoy && (
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl"
            onClick={() => {
              onElegir(hoy);
              onOpenChange(false);
            }}
          >
            Volver a hoy
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
