"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { estadoCobertura, redondear1 } from "@/lib/domain/coverage";
import { GRUPO_NOMBRE, GRUPOS, TREN_INFERIOR, TREN_SUPERIOR } from "@/lib/domain/muscles";
import type { Coverage, MuscleGroup } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const BLOQUES: { titulo: string; grupos: MuscleGroup[] }[] = [
  { titulo: "Tren superior (brazo derecho)", grupos: TREN_SUPERIOR },
  { titulo: "Tren inferior y lumbar", grupos: TREN_INFERIOR },
  { titulo: "Core (casa)", grupos: ["core"] },
];

const COLOR = {
  corto: "bg-destructive",
  justo: "bg-warn",
  ok: "bg-gradient-to-r from-[var(--neon)] to-[var(--violet)]",
  alto: "bg-lime",
};

/**
 * Barras de series efectivas por grupo muscular en la semana. La línea marca el
 * mínimo; la parte clara es lo que aporta el core en casa.
 */
export function CoverageBars({
  total,
  casa,
  minimo,
  compacto = false,
}: {
  total: Coverage;
  casa?: Coverage;
  minimo: number;
  compacto?: boolean;
}) {
  const escala = Math.max(minimo * 2, 20);
  const cortos = GRUPOS.filter((g) => estadoCobertura(total[g], minimo) === "corto");
  return (
    <div className="space-y-4">
      {cortos.length > 0 && (
        <div className="flex gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            Por debajo de {minimo} series: <strong>{cortos.map((g) => GRUPO_NOMBRE[g]).join(", ")}</strong>.
          </p>
        </div>
      )}
      {BLOQUES.map((b) => (
        <div key={b.titulo}>
          {!compacto && <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{b.titulo}</h3>}
          <ul className="space-y-1.5">
            {b.grupos.map((g) => {
              const v = total[g];
              const deCasa = casa?.[g] ?? 0;
              const est = estadoCobertura(v, minimo);
              const pct = Math.min(100, (v / escala) * 100);
              const pctCasa = Math.min(pct, (deCasa / escala) * 100);
              return (
                <li key={g} className="grid grid-cols-[7.5rem_1fr_2.75rem] items-center gap-2 text-xs">
                  <span className="truncate text-foreground/85">{GRUPO_NOMBRE[g]}</span>
                  <div
                    className="relative h-3 overflow-hidden rounded-full bg-secondary"
                    role="meter"
                    aria-label={`${GRUPO_NOMBRE[g]}: ${redondear1(v)} series de ${minimo} mínimas`}
                    aria-valuenow={redondear1(v)}
                    aria-valuemin={0}
                    aria-valuemax={escala}
                  >
                    <motion.div
                      className={cn("absolute inset-y-0 left-0 rounded-full", COLOR[est])}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {pctCasa > 0 && (
                      <div
                        className="absolute inset-y-0 right-auto rounded-full bg-white/35"
                        style={{ left: `${pct - pctCasa}%`, width: `${pctCasa}%` }}
                        title="Aportado por el core en casa"
                      />
                    )}
                    <div
                      className="absolute inset-y-0 w-0.5 bg-foreground/70"
                      style={{ left: `${(minimo / escala) * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  <span
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      est === "corto" ? "text-destructive" : est === "justo" ? "text-warn" : "text-foreground",
                    )}
                  >
                    {redondear1(v)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Series efectivas por semana: 1 por serie si el músculo es el principal y ½ o ¼ si trabaja de forma secundaria.
        La línea marca el mínimo ({minimo}); la parte clara de la barra viene del core en casa.
      </p>
    </div>
  );
}
