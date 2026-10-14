"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { useCuentaAtras } from "@/lib/hooks/use-cuenta-atras";
import { cn } from "@/lib/utils";

/** Pitido corto con Web Audio (no necesita archivos). */
export function pitar(veces = 2) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    for (let i = 0; i < veces; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      const t = ctx.currentTime + i * 0.28;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.25);
    }
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* sin audio */
  }
}

export function vibrar(patron: number[] = [250, 120, 250]) {
  if ("vibrate" in navigator) navigator.vibrate(patron);
}

export interface Descanso {
  hasta: number;
  total: number;
  etiqueta: string;
}

/**
 * Temporizador de descanso a pantalla inferior: cuenta atrás grande, +15 s y
 * saltar. Al terminar vibra y pita (según ajustes).
 */
export function RestTimer({
  descanso,
  onFin,
  onCambiar,
  sonido,
  vibracion,
}: {
  descanso: Descanso | null;
  onFin: () => void;
  onCambiar: (d: Descanso | null) => void;
  sonido: boolean;
  vibracion: boolean;
}) {
  const hasta = descanso?.hasta ?? null;
  const [aviso, setAviso] = useState(0);
  const restante = useCuentaAtras(hasta, () => {
    if (vibracion) vibrar();
    if (sonido) pitar();
    setAviso((n) => n + 1);
    onFin();
  });
  // El aviso visual se quita solo al cabo de 1,8 s.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(0), 1800);
    return () => clearTimeout(t);
  }, [aviso]);
  // Progreso de la barra: una sola animación CSS (transform) por descanso, fluida y
  // sin re-renders. El retraso negativo la sitúa en el punto actual.
  const transcurrido = descanso ? Math.max(0, descanso.total - restante) : 0;
  const mm = Math.floor(restante / 60);
  const ss = String(restante % 60).padStart(2, "0");

  return (
    <>
    {aviso > 0 && (
      <div key={aviso} className="aviso-fin-descanso pointer-events-none fixed inset-0 z-[60] grid place-items-center" role="alert">
        <p className="rounded-3xl bg-background/90 px-6 py-4 font-display text-4xl tracking-wide text-primary">¡Siguiente serie!</p>
      </div>
    )}
    <AnimatePresence>
      {descanso && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="rasgado-arriba safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl bg-background/95 px-4 backdrop-blur-md"
          role="timer"
          aria-live="polite"
        >
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              key={descanso.hasta}
              className="barra-descanso h-full w-full rounded-full bg-gradient-to-r from-[var(--neon)] to-[var(--violet)]"
              style={{ animationDuration: `${descanso.total}s`, animationDelay: `-${transcurrido}s` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{descanso.etiqueta}</p>
              <p className="font-display text-6xl tabular-nums text-primary">
                {/* Últimos 3 s: un "latido" por segundo que solo anima transform/opacity. */}
                <span key={restante <= 3 ? restante : "normal"} className={cn("inline-block", restante <= 3 && "latido")}>
                  {mm}:{ss}
                </span>
              </p>
            </div>
            <button
              type="button"
              className="grid size-16 place-items-center rounded-2xl bg-secondary text-sm font-semibold"
              onClick={() => onCambiar({ ...descanso, hasta: descanso.hasta + 15_000, total: descanso.total + 15 })}
              aria-label="Añadir 15 segundos"
            >
              <Plus className="size-5" />
              15s
            </button>
            <button
              type="button"
              className="grid size-16 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
              onClick={() => onCambiar(null)}
              aria-label="Saltar descanso"
            >
              <SkipForward className="size-5" />
              Saltar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
