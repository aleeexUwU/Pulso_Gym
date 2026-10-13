"use client";

/**
 * Destello rojo con glitch al completar algo. Se reinicia cambiando `disparo`.
 * Con movimiento reducido no se muestra (ver globals.css).
 */
export function FlashSangre({ disparo }: { disparo: number }) {
  if (disparo === 0) return null;
  return (
    <div
      key={disparo}
      aria-hidden
      className="flash-sangre pointer-events-none fixed inset-0 z-[60]"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 45%, oklch(0.5 0.21 25 / 0.45) 100%), linear-gradient(transparent 48%, oklch(0.64 0.22 25 / 0.18) 49%, transparent 51%)",
      }}
    />
  );
}
