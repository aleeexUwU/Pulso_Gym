"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAbsSessions, useAjustes } from "@/lib/db/hooks";
import { hoyISO } from "@/lib/domain/dates";
import { mostrarNotificacion, sincronizarRecordatorioConSW } from "@/lib/pwa/recordatorio";
import { iniciarSyncAutomatica } from "@/lib/sync/sync";

/** Registra el service worker en producción y avisa cuando hay versión nueva. */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let recargado = false;
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        nuevo?.addEventListener("statechange", () => {
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
            toast("Hay una versión nueva", {
              action: { label: "Actualizar", onClick: () => nuevo.postMessage("SKIP_WAITING") },
              duration: 15000,
            });
          }
        });
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargado) return;
      recargado = true;
      window.location.reload();
    });
  }, []);
}

function TemaDesdeAjustes() {
  const ajustes = useAjustes();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (!ajustes) return;
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
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* Respeta prefers-reduced-motion en todas las animaciones de Framer Motion. */}
      <MotionConfig reducedMotion="user">
        <TemaDesdeAjustes />
        <RecordatorioEnApp />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </MotionConfig>
    </ThemeProvider>
  );
}
