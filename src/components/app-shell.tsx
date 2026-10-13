"use client";

import { Activity, Dumbbell, Hand, LineChart, Settings, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useAjustes, usePerfil } from "@/lib/db/hooks";
import { cn } from "@/lib/utils";

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

const SIN_NAV = ["/bienvenida", "/gimnasio/sesion", "/abdominales/sesion", "/brazo/sesion"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const perfil = usePerfil();
  const ajustes = useAjustes();
  const online = useOnline();
  const ruta = pathname.replace(/\/$/, "") || "/";
  const ocultarNav = SIN_NAV.some((p) => ruta.startsWith(p));

  // Sin perfil → onboarding.
  useEffect(() => {
    if (perfil === null && !ruta.startsWith("/bienvenida")) router.replace("/bienvenida/");
  }, [perfil, ruta, router]);

  const items = [
    { href: "/", label: "Gimnasio", icon: Dumbbell, activo: ruta === "/" || ruta.startsWith("/gimnasio") || ruta.startsWith("/ejercicios") },
    { href: "/abdominales/", label: "Core", icon: Activity, activo: ruta.startsWith("/abdominales") },
    ...(ajustes?.moduloBrazo
      ? [{ href: "/brazo/", label: "Brazo izq.", icon: Hand, activo: ruta.startsWith("/brazo") }]
      : []),
    { href: "/progreso/", label: "Progreso", icon: LineChart, activo: ruta.startsWith("/progreso") },
    { href: "/ajustes/", label: "Ajustes", icon: Settings, activo: ruta.startsWith("/ajustes") },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      {!online && (
        <div className="safe-top sticky top-0 z-50 flex items-center justify-center gap-2 bg-warn/15 px-3 py-1.5 text-xs text-warn backdrop-blur">
          <WifiOff className="size-3.5" /> Sin conexión: todo se guarda en el móvil y se sincroniza después.
        </div>
      )}
      <main className={cn("safe-top flex-1 px-4 pt-4", ocultarNav ? "pb-6" : "pb-28")}>
        <motion.div
          key={ruta}
          initial={{ opacity: 0, x: 10, skewX: -3 }}
          animate={{ opacity: [0, 1, 0.7, 1], x: [10, -3, 2, 0], skewX: [-3, 2, 0, 0] }}
          transition={{ duration: 0.32, times: [0, 0.4, 0.7, 1] }}
        >
          {children}
        </motion.div>
      </main>
      {!ocultarNav && perfil && (
        <nav
          aria-label="Navegación principal"
          className="rasgado-arriba safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl bg-background/90 px-2 backdrop-blur-md"
        >
          <ul className="flex items-stretch justify-around">
            {items.map(({ href, label, icon: Icon, activo }) => (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                    activo ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {activo && (
                    <motion.span
                      layoutId="nav-activo"
                      className="absolute inset-x-2 inset-y-0.5 -z-10 rounded-[0.9rem_0.4rem_1rem_0.5rem] bg-primary/12 neon-border"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
