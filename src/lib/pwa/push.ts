"use client";

import { supabase } from "@/lib/sync/supabase";

/**
 * Notificaciones push (Web Push). En iPhone solo funcionan con la app añadida a la
 * pantalla de inicio (iOS 16.4+). El servidor (función enviar-recordatorios, cada 15
 * min) avisa a la hora elegida si hoy falta el gimnasio o el core.
 */

// Clave pública VAPID (no es secreta; la privada está en los secretos de Supabase).
const VAPID_PUBLICA = "BPxr7vUnuShRQdVBHST0YBsihM2S78AkOgOL749wiGyss4qtpe5t3kcRXECChAcWnPt_wKBXh92W4lGRNptfJw8";

export function pushSoportado(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function esIOS(): boolean {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function enModoApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function claveABytes(b64: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function guardarEnServidor(sub: PushSubscription, hora: string, activo: boolean): Promise<void> {
  const sb = supabase();
  if (!sb) throw new Error("Las notificaciones necesitan Supabase configurado.");
  const json = sub.toJSON();
  const { error } = await sb.from("suscripciones_push").upsert({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid",
    hora,
    activo,
    actualizado_en: new Date().toISOString(),
  });
  if (error) throw new Error("No se pudo guardar la suscripción: " + error.message);
}

/** Activa los avisos en este dispositivo (pide permiso, se suscribe y lo guarda en tu cuenta). */
export async function activarPush(hora: string): Promise<void> {
  const sb = supabase();
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
  if (!data.session) throw new Error("Inicia sesión en Ajustes → Cuenta para recibir avisos con la app cerrada.");
  if (Notification.permission !== "granted" && (await Notification.requestPermission()) !== "granted") {
    throw new Error("No has dado permiso para las notificaciones.");
  }
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(VAPID_PUBLICA) }));
  await guardarEnServidor(sub, hora, true);
}

/** Activa o quita el aviso de proteína en este dispositivo (debe estar suscrito). */
export async function avisoProteinaPush(activo: boolean, objetivo: number): Promise<boolean> {
  if (!pushSoportado()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return false;
  const { error } = (await supabase()
    ?.from("suscripciones_push")
    .update({ aviso_proteina: activo, proteina_objetivo: objetivo, actualizado_en: new Date().toISOString() })
    .eq("endpoint", sub.endpoint)) ?? { error: null };
  return !error;
}

/** Cambia la hora (si este dispositivo está suscrito). */
export async function actualizarHoraPush(hora: string): Promise<void> {
  if (!pushSoportado()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await guardarEnServidor(sub, hora, true);
}

export async function desactivarPush(): Promise<void> {
  if (!pushSoportado()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase()?.from("suscripciones_push").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}
