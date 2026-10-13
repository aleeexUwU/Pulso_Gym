"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAjustes } from "@/lib/db/hooks";
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

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  useEffect(() => iniciarSyncAutomatica(), []);
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TemaDesdeAjustes />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </ThemeProvider>
  );
}
