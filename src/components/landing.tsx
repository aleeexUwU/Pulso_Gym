"use client";

import { Activity, Apple, Dumbbell, WifiOff } from "lucide-react";
import { useState } from "react";
import { CuentaCard } from "@/components/cuenta-card";
import { Kakugan } from "@/components/kakugan";
import { Button } from "@/components/ui/button";
import { supabaseConfigurado } from "@/lib/sync/supabase";

const QUE_HACE = [
  {
    icono: Dumbbell,
    titulo: "Gimnasio a una mano",
    texto: "Una rutina que trabaja todos los músculos con el brazo derecho, sin cargar nunca la mano izquierda.",
  },
  {
    icono: Activity,
    titulo: "Core en casa cada día",
    texto: "Crunch, plancha y elevaciones en 10–15 minutos, un poco más difícil cada semana.",
  },
  {
    icono: Apple,
    titulo: "Dieta sin apuntar a mano",
    texto: "Hazle una foto al plato, escanea el código de barras o escribe lo que has comido.",
  },
  {
    icono: WifiOff,
    titulo: "Funciona sin cobertura",
    texto: "Se instala como una app y guarda cada serie al momento, aunque no haya red en el gimnasio.",
  },
];

/** Portada para quien abre la app por primera vez (o en un móvil nuevo). */
export function Landing({ onEmpezar }: { onEmpezar: () => void }) {
  const [entrar, setEntrar] = useState(false);
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <div className="relative grid place-items-center pb-2 pt-6">
        {/* Halo carmesí detrás del ojo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 bg-[radial-gradient(ellipse_at_center,oklch(0.5_0.2_25/0.35),transparent_70%)]"
        />
        <Kakugan className="ojo-abrir relative w-[78%] max-w-sm" parpadeo={false} />
      </div>

      <h1 className="mt-2 font-logo text-[clamp(2.4rem,11vw,3.6rem)] leading-none text-primary">VL3X-GYM</h1>
      <p className="mt-3 max-w-[34ch] text-lg leading-snug text-foreground/90">
        Tu entreno personal, pensado para hacerlo todo con el brazo derecho.
      </p>

      <ul className="mt-7 space-y-5">
        {QUE_HACE.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-4">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-[0.8rem_0.35rem_0.9rem_0.4rem] border border-primary/40 bg-primary/10 text-primary">
              <Icono className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-heading text-xl leading-tight tracking-wide">{titulo}</span>
              <span className="block text-sm leading-relaxed text-muted-foreground">{texto}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-8">
        {!entrar && (
          <>
            <Button className="h-14 w-full rounded-2xl text-lg font-bold" onClick={onEmpezar}>
              Crear mi rutina
            </Button>
            {supabaseConfigurado && (
              <Button variant="ghost" className="h-12 w-full rounded-2xl text-base" onClick={() => setEntrar(true)}>
                Ya tengo cuenta
              </Button>
            )}
          </>
        )}
        {entrar && (
          <div className="glass space-y-3 p-4">
            <p className="font-heading text-2xl tracking-wide">Entrar</p>
            <p className="text-sm text-muted-foreground">Al entrar se descargan tu rutina, tu historial y tu dieta.</p>
            <CuentaCard />
            <Button variant="ghost" className="w-full" onClick={() => setEntrar(false)}>
              Volver
            </Button>
          </div>
        )}
        <p className="pb-2 text-center text-xs text-muted-foreground">
          Orientativa: consulta con tu médico o fisioterapeuta antes de empezar.
        </p>
      </div>
    </div>
  );
}
