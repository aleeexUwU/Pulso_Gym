"use client";

import { useEffect, useRef, useState } from "react";

/** Segundos que quedan hasta `hasta` (redondeo hacia arriba, nunca negativo). */
export function segundosRestantes(hasta: number, ahora = Date.now()): number {
  return Math.max(0, Math.ceil((hasta - ahora) / 1000));
}

/** Milisegundos hasta el próximo cambio de segundo visible (mínimo 16 ms). */
export function msHastaSiguienteCambio(hasta: number, ahora = Date.now()): number {
  const resto = hasta - ahora;
  if (resto <= 0) return 0;
  return Math.max(16, resto % 1000 || 1000);
}

/**
 * Cuenta atrás precisa basada en timestamps reales (Date.now()), no en contar
 * ticks de setInterval: aunque el navegador retrase un temporizador (móvil en
 * segundo plano, CPU ocupada), el valor siempre se recalcula desde `hasta`.
 * Solo provoca un render por segundo, justo en el cambio de segundo, y llama a
 * `onFin` una única vez al llegar a cero.
 */
export function useCuentaAtras(hasta: number | null, onFin?: () => void): number {
  // Se guarda junto a qué `hasta` corresponde: si cambia, el primer render ya
  // muestra el valor correcto (sin un fotograma con el número antiguo o 0).
  const [estado, setEstado] = useState(() => ({ hasta, s: hasta ? segundosRestantes(hasta) : 0 }));
  const onFinRef = useRef(onFin);
  useEffect(() => {
    onFinRef.current = onFin;
  });

  useEffect(() => {
    if (hasta == null) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    let terminado = false;

    const tic = () => {
      const s = segundosRestantes(hasta);
      setEstado({ hasta, s });
      if (s === 0) {
        if (!terminado) {
          terminado = true;
          onFinRef.current?.();
        }
        return;
      }
      // +5 ms para caer justo después del cambio de segundo, no justo antes.
      t = setTimeout(tic, msHastaSiguienteCambio(hasta) + 5);
    };
    tic();

    // Al volver a la app (pantalla bloqueada, otra pestaña) se resincroniza al instante.
    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      if (t) clearTimeout(t);
      tic();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      if (t) clearTimeout(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [hasta]);

  if (hasta == null) return 0;
  return estado.hasta === hasta ? estado.s : segundosRestantes(hasta);
}
