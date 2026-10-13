"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [ahora, setAhora] = useState(() => Date.now());
  const avisado = useRef<number | null>(null);

  useEffect(() => {
    if (!descanso) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [descanso]);

  const restante = descanso ? Math.max(0, Math.ceil((descanso.hasta - ahora) / 1000)) : 0;

  useEffect(() => {
    if (!descanso || restante > 0 || avisado.current === descanso.hasta) return;
    avisado.current = descanso.hasta;
    if (vibracion) vibrar();
    if (sonido) pitar();
    onFin();
  }, [descanso, restante, sonido, vibracion, onFin]);

  const pct = descanso ? Math.min(100, ((descanso.total - restante) / descanso.total) * 100) : 0;
  const mm = Math.floor(restante / 60);
  const ss = String(restante % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {descanso && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="glass safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl px-4 pt-3"
          role="timer"
          aria-live="polite"
        >
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--neon)] to-[var(--violet)] transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{descanso.etiqueta}</p>
              <p className="font-display text-5xl font-bold tabular-nums neon-text">
                {mm}:{ss}
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
  );
}
