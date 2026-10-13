/**
 * Vibración muy corta como respuesta táctil (Android; iOS la ignora).
 * Se activa o desactiva desde Ajustes → Vibración.
 */
let activa = true;

export function configurarHaptica(on: boolean) {
  activa = on;
}

export function toque(ms = 8) {
  if (!activa || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(ms);
}
