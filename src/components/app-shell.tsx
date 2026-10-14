"use client";

import { Activity, Apple, Dumbbell, Hand, LineChart, Settings, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { FondoHiganbana } from "@/components/fondo-higanbana";
import { Logo } from "@/components/kakugan";
import { useAjustes, usePerfil } from "@/lib/db/hooks";
import { toque } from "@/lib/haptics";
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

const SIN_NAV = ["/bienvenida", "/gimnasio/sesion", "/abdominales/sesion", "/brazo/sesion", "/dieta/nueva", "/dieta/batidos/editar"];

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
    { href: "/dieta/", label: "Dieta", icon: Apple, activo: ruta.startsWith("/dieta") },
    { href: "/progreso/", label: "Progreso", icon: LineChart, activo: ruta.startsWith("/progreso") },
    { href: "/ajustes/", label: "Ajustes", icon: Settings, activo: ruta.startsWith("/ajustes") },
  ];

  const conNav = !ocultarNav && !!perfil;
  // En PC, las pantallas con mucho contenido usan dos columnas y más ancho.
  const ancha = ruta === "/" || ruta === "/dieta";

  return (
    <div className={cn("min-h-dvh", conNav && "lg:pl-64")}>
      {/* Fondo ilustrado: ciempiés a tinta y lirio araña carmesí, fijo detrás de todo. */}
      <div
        aria-hidden
        className="fondo-higanbana pointer-events-none fixed bottom-0 right-[-22%] -z-[1] aspect-[3/5] h-[94dvh] sm:right-[-6%] lg:right-0 lg:h-dvh"
      >
        <FondoHiganbana className="size-full" />
      </div>
      {conNav && (
        <aside
          aria-label="Navegación lateral"
          className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-border bg-background/70 px-4 py-6 backdrop-blur-md lg:flex"
        >
          <Link href="/" className="mb-8 px-2">
            <Logo />
          </Link>
          <ul className="relative z-10 space-y-1">
            {items.map(({ href, label, icon: Icon, activo }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "relative flex h-12 items-center gap-3 rounded-[0.9rem_0.4rem_1rem_0.5rem] px-3 text-[15px] font-medium transition-colors",
                    activo ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {activo && (
                    <motion.span
                      layoutId="lateral-activo"
                      className="absolute inset-0 -z-10 rounded-[0.9rem_0.4rem_1rem_0.5rem] bg-primary/12 neon-border"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className="size-5" aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="relative z-10 mt-auto px-2 text-xs text-muted-foreground">
            {online ? "Tus datos se guardan en este equipo y en tu cuenta." : "Sin conexión: se sincroniza al volver."}
          </p>
        </aside>
      )}
      <div className={cn("mx-auto flex min-h-dvh w-full max-w-xl flex-col", ancha ? "lg:max-w-6xl" : "lg:max-w-3xl")}>
        {!online && (
          <div className="safe-top sticky top-0 z-50 flex items-center justify-center gap-2 bg-warn/15 px-3 py-1.5 text-xs text-warn backdrop-blur lg:hidden">
            <WifiOff className="size-3.5" /> Sin conexión: todo se guarda en el móvil y se sincroniza después.
          </div>
        )}
        <main className={cn("pt-safe safe-x flex-1 lg:px-10 lg:pt-10", ocultarNav ? "pb-safe-6" : "pb-nav lg:pb-12")}>
          {/* Entrada con CSS: si la animación no llegara a correr, el contenido se ve igual. */}
          <div key={ruta} className="entrada-pagina">
            {children}
          </div>
        </main>
        {conNav && (
          <nav
            aria-label="Navegación principal"
            className="rasgado-arriba safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl bg-background/90 backdrop-blur-md lg:hidden"
          >
            <ul className="flex items-stretch justify-around">
              {items.map(({ href, label, icon: Icon, activo }) => (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    onClick={() => !activo && toque()}
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
                    <motion.span
                      key={activo ? "activo" : "inactivo"}
                      initial={activo ? { y: 0, scale: 1 } : false}
                      animate={activo ? { y: [0, -4, 0], scale: [1, 1.18, 1] } : { y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="grid place-items-center"
                    >
                      <Icon className="size-5" aria-hidden />
                    </motion.span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
