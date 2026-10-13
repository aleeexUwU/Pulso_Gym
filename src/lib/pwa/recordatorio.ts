"use client";

/**
 * Recordatorio diario de abdominales.
 * Las PWA no pueden programar una notificación exacta con la app cerrada sin un
 * servidor de push. Combinamos:
 * 1) Periodic Background Sync (Chrome/Android con la app instalada): el SW revisa
 *    cada cierto tiempo y avisa si ya pasó la hora y no has hecho la sesión.
 * 2) Aviso al abrir la app o mientras está abierta.
 * 3) Un evento de calendario (.ics) diario como alternativa fiable en iPhone.
 */

export interface ConfigRecordatorio {
  activo: boolean;
  hora: string;
  hechoHoy?: string | null;
}

export function notificacionesSoportadas(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function pedirPermiso(): Promise<NotificationPermission> {
  if (!notificacionesSoportadas()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export async function sincronizarRecordatorioConSW(cfg: ConfigRecordatorio): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.active?.postMessage({ tipo: "RECORDATORIO", config: cfg });
  type PeriodicReg = ServiceWorkerRegistration & {
    periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void>; unregister: (t: string) => Promise<void> };
  };
  const ps = (reg as PeriodicReg | undefined)?.periodicSync;
  if (!ps) return;
  try {
    if (cfg.activo) await ps.register("recordatorio-abs", { minInterval: 60 * 60 * 1000 });
    else await ps.unregister("recordatorio-abs");
  } catch {
    /* sin permiso de periodic sync: queda el aviso al abrir la app y el .ics */
  }
}

export async function mostrarNotificacion(titulo: string, cuerpo: string, url = "/abdominales/"): Promise<boolean> {
  if (!notificacionesSoportadas() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    await reg.showNotification(titulo, { body: cuerpo, icon: "/icons/icon-192.png", tag: "recordatorio-abs", data: { url } });
    return true;
  }
  new Notification(titulo, { body: cuerpo, icon: "/icons/icon-192.png" });
  return true;
}

/** Evento de calendario diario con alarma a la hora elegida. */
export function descargarICS(hora: string): void {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (x: Date) =>
    `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
  const fin = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m + 15);
  const url = typeof window !== "undefined" ? window.location.origin + "/abdominales/" : "";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gym PWA//ES",
    "BEGIN:VEVENT",
    `UID:abs-diario-${Date.now()}@gym-pwa`,
    `DTSTAMP:${fmt(d)}`,
    `DTSTART:${fmt(ini)}`,
    `DTEND:${fmt(fin)}`,
    "RRULE:FREQ=DAILY",
    "SUMMARY:Core en casa (10–15 min)",
    `DESCRIPTION:Abre la app: ${url}`,
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hora de los abdominales",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "recordatorio-abdominales.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
