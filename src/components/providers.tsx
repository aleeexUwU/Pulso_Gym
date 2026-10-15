"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAbsSessions, useAjustes } from "@/lib/db/hooks";
import { hoyISO } from "@/lib/domain/dates";
import { mostrarNotificacion, sincronizarRecordatorioConSW } from "@/lib/pwa/recordatorio";
import { configurarHaptica } from "@/lib/haptics";
import { conservarAjustesAntiguos } from "@/lib/app/planificacion";
import { iniciarSyncAutomatica, suscribirSync } from "@/lib/sync/sync";

/**
 * Registra el service worker en producción y aplica las versiones nuevas solas, sin
 * cortar a nadie a mitad de una serie: al abrir la app (si ya había una esperando) o
 * al salir de ella. Mientras está abierta, un aviso permite actualizar al momento.
 * (Antes solo se aplicaba pulsando el aviso, y en el iPhone la app casi nunca se cierra
 * del todo: se quedaba la versión antigua indefinidamente.)
 */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let recargado = false;
    let quitar = () => {};
    const aplicar = (sw: ServiceWorker | null | undefined) => sw?.postMessage("SKIP_WAITING");
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Ya había una versión esperando: la app acaba de abrirse, se aplica ya.
      if (reg.waiting && navigator.serviceWorker.controller) aplicar(reg.waiting);
      const vigilar = (nuevo: ServiceWorker | null) => {
        nuevo?.addEventListener("statechange", () => {
          if (nuevo.state !== "installed" || !navigator.serviceWorker.controller) return;
          if (document.visibilityState === "hidden") return aplicar(nuevo);
          toast("Hay una versión nueva", {
            description: "Se aplicará sola al salir de la app.",
            action: { label: "Actualizar ya", onClick: () => aplicar(nuevo) },
            duration: 10000,
          });
        });
      };
      // La descarga puede haber empezado antes de llegar aquí (al registrar): también se vigila.
      vigilar(reg.installing);
      reg.addEventListener("updatefound", () => vigilar(reg.installing));
      // Al salir de la app se aplica lo que haya pendiente; al volver se buscan versiones nuevas.
      const alCambiar = () => {
        if (document.visibilityState === "hidden") aplicar(reg.waiting);
        else void reg.update().catch(() => {});
      };
      document.addEventListener("visibilitychange", alCambiar);
      quitar = () => document.removeEventListener("visibilitychange", alCambiar);
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargado) return;
      recargado = true;
      window.location.reload();
    });
    return () => quitar();
  }, []);
}

function TemaDesdeAjustes() {
  const ajustes = useAjustes();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (!ajustes) return;
    configurarHaptica(ajustes.vibracion);
    setTheme(ajustes.tema === "claro" ? "light" : ajustes.tema === "sistema" ? "system" : "dark");
  }, [ajustes, setTheme]);
  return null;
}

/** Aviso del recordatorio con la app abierta (y sincroniza la hora con el SW). */
function RecordatorioEnApp() {
  const ajustes = useAjustes();
  const abs = useAbsSessions();
  useEffect(() => {
    if (!ajustes || !abs) return;
    const hoy = hoyISO();
    const hechoHoy = abs.some((a) => a.fecha === hoy && a.completado);
    void sincronizarRecordatorioConSW({ ...ajustes.recordatorio, hechoHoy: hechoHoy ? hoy : null });
    if (!ajustes.recordatorio.activo || hechoHoy) return;
    const comprobar = () => {
      const [h, m] = ajustes.recordatorio.hora.split(":").map(Number);
      const d = new Date();
      const pasada = d.getHours() > h || (d.getHours() === h && d.getMinutes() >= m);
      const clave = "gym-recordatorio-avisado";
      if (!pasada || localStorage.getItem(clave) === hoyISO()) return;
      localStorage.setItem(clave, hoyISO());
      void mostrarNotificacion("Core en casa", "Te quedan tus 10–15 min de abdominales de hoy.").then((ok) => {
        if (!ok) toast("Hora del core en casa 💪", { description: "10–15 min para mantener la racha." });
      });
    };
    comprobar();
    const t = setInterval(comprobar, 60_000);
    return () => clearInterval(t);
  }, [ajustes, abs]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  useEffect(() => iniciarSyncAutomatica(), []);
  // Conserva los ajustes de quien ya usaba la app antes de que fuera para cualquiera
  // (al abrir y cada vez que se descargan datos de la cuenta).
  useEffect(() => {
    void conservarAjustesAntiguos();
    return suscribirSync((e) => {
      if (e.tipo === "ok") void conservarAjustesAntiguos();
    });
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* Respeta prefers-reduced-motion en todas las animaciones de Framer Motion. */}
      <MotionConfig reducedMotion="user">
        <TemaDesdeAjustes />
        <RecordatorioEnApp />
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          mobileOffset={{ top: "calc(env(safe-area-inset-top) + 8px)", left: 12, right: 12 }}
        />
      </MotionConfig>
    </ThemeProvider>
  );
}
