"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, CircleAlert, Flame } from "lucide-react";
import { estadoCobertura, redondear1, type EstadoCobertura } from "@/lib/domain/coverage";
import { GRUPO_NOMBRE, GRUPOS, TREN_INFERIOR, TREN_SUPERIOR } from "@/lib/domain/muscles";
import type { Coverage, MuscleGroup } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const BLOQUES: { titulo: string; grupos: MuscleGroup[] }[] = [
  { titulo: "Tren superior (brazo derecho)", grupos: TREN_SUPERIOR },
  { titulo: "Tren inferior y lumbar", grupos: TREN_INFERIOR },
  { titulo: "Core (casa)", grupos: ["core"] },
];

/**
 * Cada estado tiene color, icono, texto y (si es "corto") rayado: el rojo nunca es el
 * único indicador. "ok" usa hueso para no confundirse con el carmesí del acento.
 */
const ESTADO: Record<EstadoCobertura, { barra: string; texto: string; icono: typeof Check; etiqueta: string }> = {
  corto: { barra: "text-warn rayado", texto: "text-warn", icono: AlertTriangle, etiqueta: "corto" },
  justo: { barra: "bg-warn", texto: "text-warn", icono: CircleAlert, etiqueta: "justo" },
  ok: { barra: "bg-lime/85", texto: "text-foreground", icono: Check, etiqueta: "bien" },
  alto: { barra: "bg-gradient-to-r from-[var(--neon)] to-[var(--violet)]", texto: "text-primary", icono: Flame, etiqueta: "alto" },
};

/**
 * Barras de series efectivas por grupo muscular en la semana. La línea marca el
 * mínimo; la parte con puntos es lo que aporta el core en casa.
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
      {cortos.length > 0 ? (
        <div className="flex gap-2 rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p>
            <strong>Grupos cortos</strong> (menos de {minimo} series): {cortos.map((g) => GRUPO_NOMBRE[g]).join(", ")}.
          </p>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 text-lime" /> Todos los grupos llegan al mínimo de {minimo} series.
        </p>
      )}
      {BLOQUES.map((b) => (
        <div key={b.titulo}>
          {!compacto && <h3 className="mb-2 text-xs text-muted-foreground">{b.titulo}</h3>}
          <ul className="space-y-1.5">
            {b.grupos.map((g) => {
              const v = total[g];
              const deCasa = casa?.[g] ?? 0;
              const est = estadoCobertura(v, minimo);
              const E = ESTADO[est];
              const pct = Math.min(100, (v / escala) * 100);
              const pctCasa = Math.min(pct, (deCasa / escala) * 100);
              return (
                <li key={g} className="grid grid-cols-[7.5rem_1fr_4.25rem] items-center gap-2 text-xs">
                  <span className="truncate text-foreground/90">{GRUPO_NOMBRE[g]}</span>
                  <div
                    className="relative h-3 overflow-hidden rounded-[3px] bg-secondary"
                    role="meter"
                    aria-label={`${GRUPO_NOMBRE[g]}: ${redondear1(v)} series de ${minimo} mínimas (${E.etiqueta})`}
                    aria-valuenow={redondear1(v)}
                    aria-valuemin={0}
                    aria-valuemax={escala}
                  >
                    <motion.div
                      className={cn("absolute inset-y-0 left-0 rounded-[3px]", E.barra)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {pctCasa > 0 && (
                      <div
                        className="absolute inset-y-0 bg-[radial-gradient(circle,oklch(0.14_0.004_20/0.55)_1px,transparent_1.5px)] bg-[length:4px_4px]"
                        style={{ left: `${pct - pctCasa}%`, width: `${pctCasa}%` }}
                        title="Aportado por el core en casa"
                      />
                    )}
                    <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${(minimo / escala) * 100}%` }} aria-hidden />
                  </div>
                  <span className={cn("flex items-center justify-end gap-1 font-semibold tabular-nums", E.texto)}>
                    <E.icono className="size-3.5 shrink-0" aria-hidden />
                    {redondear1(v)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Series efectivas por semana: 1 por serie si el músculo es el principal y ½ o ¼ si trabaja de forma secundaria. La línea
        blanca marca el mínimo ({minimo}); la parte punteada viene del core en casa. ✓ bien · ! justo · ⚠ corto (rayado) · 🔥 alto.
      </p>
    </div>
  );
}
