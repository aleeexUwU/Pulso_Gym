"use client";

import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Glass, SectionTitle } from "@/components/ui-kit";
import { totales } from "@/lib/app/dieta";
import { logsDeWorkouts } from "@/lib/app/gimnasio";
import type { AbsSession, BodyWeight, Comida, Workout } from "@/lib/db/types";
import { formatoFecha, sumarDias } from "@/lib/domain/dates";
import { ejercicio } from "@/lib/domain/exercises";
import { mejorE1rm } from "@/lib/domain/progression";
import type { Plan } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Resumen de una semana (lunes a domingo): entrenos, core, series, récords, dieta y peso.
 * Por defecto la semana pasada si hoy es lunes o martes (la actual aún está empezando).
 */
export function ResumenSemana({
  workouts,
  abs,
  comidas,
  pesos,
  plan,
  objetivoKcal,
  objetivoProteina,
  lunesActual,
  hoy,
}: {
  workouts: Workout[];
  abs: AbsSession[];
  comidas: Comida[];
  pesos: BodyWeight[];
  plan: Plan | null;
  objetivoKcal: number;
  objetivoProteina: number;
  lunesActual: string;
  hoy: string;
}) {
  const [desplazamiento, setDesplazamiento] = useState(() => (hoy <= sumarDias(lunesActual, 1) ? -1 : 0));
  const desde = sumarDias(lunesActual, desplazamiento * 7);
  const hasta = sumarDias(desde, 6);
  const enSemana = (f: string) => f >= desde && f <= hasta;

  const hechos = workouts.filter((w) => w.estado === "completado" && enSemana(w.fecha));
  const previstos = plan?.dias.length ?? 0;
  const core = new Set(abs.filter((a) => a.completado && enSemana(a.fecha)).map((a) => a.fecha)).size;
  const series = hechos.reduce((t, w) => t + w.ejercicios.reduce((s, e) => s + e.series.filter((x) => x.hecho).length, 0), 0);
  const volumen = hechos.reduce(
    (t, w) => t + w.ejercicios.reduce((s, e) => s + e.series.reduce((v, x) => v + (x.hecho ? (x.pesoKg ?? 0) * (x.reps ?? 0) : 0), 0), 0),
    0,
  );

  // Récords: ejercicios cuyo mejor 1RM de esta semana supera todo lo anterior.
  const logs = logsDeWorkouts(workouts);
  const records = [...new Set(logs.filter((l) => enSemana(l.fecha)).map((l) => l.exerciseId))].filter((id) => {
    const esta = Math.max(0, ...logs.filter((l) => l.exerciseId === id && enSemana(l.fecha)).map(mejorE1rm));
    const antes = Math.max(0, ...logs.filter((l) => l.exerciseId === id && l.fecha < desde).map(mejorE1rm));
    return antes > 0 && esta > antes;
  });

  const diasComida = Array.from({ length: 7 }, (_, i) => sumarDias(desde, i))
    .map((f) => totales(comidas.filter((c) => c.fecha === f)))
    .filter((t) => t.kcal > 0);
  const media = (k: "kcal" | "proteinas") => (diasComida.length ? Math.round(diasComida.reduce((s, t) => s + t[k], 0) / diasComida.length) : 0);
  const diasObjetivo = diasComida.filter((t) => t.kcal >= objetivoKcal * 0.9 && t.proteinas >= objetivoProteina * 0.9).length;

  const pesosSemana = pesos.filter((p) => enSemana(p.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const anterior = pesos.filter((p) => p.fecha < desde).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const ultimoPeso = pesosSemana.at(-1);
  const cambio = ultimoPeso && anterior ? Math.round((ultimoPeso.kg - anterior.kg) * 10) / 10 : null;

  const filas: { etiqueta: string; valor: string; bien?: boolean }[] = [
    { etiqueta: "Gimnasio", valor: `${hechos.length} de ${previstos} sesiones`, bien: previstos > 0 && hechos.length >= previstos },
    { etiqueta: "Core en casa", valor: `${core} de 7 días`, bien: core >= 5 },
    { etiqueta: "Series hechas", valor: `${series}${volumen ? ` · ${Math.round(volumen).toLocaleString("es-ES")} kg movidos` : ""}` },
    {
      etiqueta: "Dieta",
      valor: diasComida.length
        ? `${media("kcal")} kcal y ${media("proteinas")} g de proteína de media · objetivo cumplido ${diasObjetivo} de ${diasComida.length} días`
        : "sin comidas registradas",
      bien: diasComida.length > 0 && diasObjetivo >= Math.ceil(diasComida.length * 0.7),
    },
    {
      etiqueta: "Peso",
      valor: ultimoPeso
        ? `${String(ultimoPeso.kg).replace(".", ",")} kg${cambio != null ? ` (${cambio > 0 ? "+" : ""}${String(cambio).replace(".", ",")} kg)` : ""}`
        : "sin pesarte esta semana",
    },
  ];

  return (
    <Glass className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Tu semana</SectionTitle>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => setDesplazamiento((d) => d - 1)}>
            <ChevronLeft />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatoFecha(desde)} – {formatoFecha(hasta)}
          </span>
          <Button variant="ghost" size="icon" aria-label="Semana siguiente" disabled={desplazamiento >= 0} onClick={() => setDesplazamiento((d) => d + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border text-sm">
        {filas.map((f) => (
          <li key={f.etiqueta} className="flex gap-3 py-2">
            <span className="w-24 shrink-0 text-muted-foreground">{f.etiqueta}</span>
            <span className={cn("min-w-0 flex-1", f.bien && "text-lime")}>
              {f.valor}
              {f.bien && <span className="sr-only"> (bien)</span>}
            </span>
          </li>
        ))}
      </ul>
      {records.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3 text-sm">
          <Trophy className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <strong>{records.length === 1 ? "Nuevo récord" : `${records.length} récords nuevos`}:</strong>{" "}
            {records.map((id) => ejercicio(id).nombre).join(", ")}.
          </span>
        </p>
      )}
    </Glass>
  );
}
