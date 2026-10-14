"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { imagenesEjercicio } from "@/lib/domain/exercises";
import type { Exercise } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Ilustracion } from "./illustration";

/** Fases de una repetición, en el mismo orden y reparto que la animación `rep-*` de globals.css. */
const FASES = ["Inicio", "Contrae", "Aprieta", "Vuelve despacio"] as const;

/**
 * Animación de la repetición a partir de las fotos de posición inicial y final
 * (free-exercise-db): pausa en el inicio, contracción rápida, pausa arriba y vuelta
 * lenta, como el ritmo que hay que llevar. Todo con CSS (opacity/transform), sin
 * re-renderizar. Tratadas en blanco y negro sobre hueso para encajar con la app.
 *
 * - `animar=false`: miniatura quieta (listas).
 * - `detalle`: muestra la fase, la barra de ritmo y deja pausar con un toque.
 * - Con "reducir movimiento": las dos posiciones lado a lado, sin animación.
 */
export function ExerciseImage({
  ejercicio,
  className,
  animar = true,
  detalle = false,
}: {
  ejercicio: Exercise;
  className?: string;
  animar?: boolean;
  detalle?: boolean;
}) {
  const imgs = imagenesEjercicio(ejercicio);
  const [error, setError] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [cargada, setCargada] = useState(false);

  if (!imgs || error) {
    return (
      <div className={cn("grid place-items-center overflow-hidden rounded-2xl bg-secondary/60", className)}>
        <Ilustracion clave={ejercicio.ilustracion} className="h-full max-h-56 w-full" />
      </div>
    );
  }

  const foto = (src: string, i: number, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- exportación estática, imágenes ya optimizadas en WebP
    <img
      src={src}
      alt={`${ejercicio.nombre}: ${i === 0 ? "posición inicial" : "posición final"}`}
      className={cn("foto-ej-img absolute inset-0 size-full object-contain", extra)}
      loading="lazy"
      decoding="async"
      onError={() => setError(true)}
    />
  );

  // Miniatura: recortada a la persona (sin bandas), fondo oscuro mientras carga y aparece con un fundido.
  if (!animar) {
    return (
      <div className={cn("foto-mini relative overflow-hidden rounded-xl", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- exportación estática, imágenes ya optimizadas en WebP */}
        <img
          src={imgs[0]}
          alt={`${ejercicio.nombre}: posición inicial`}
          className={cn("foto-mini-img absolute inset-0 size-full object-cover", cargada && "cargada")}
          loading="lazy"
          decoding="async"
          onLoad={() => setCargada(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  const contenido = (
    <>
      {/* Con movimiento: la final aparece y desaparece sobre la inicial siguiendo el ritmo. */}
      <div className="rep-animada absolute inset-0">
        {foto(imgs[0], 0)}
        {foto(imgs[1], 1, "rep-final")}
      </div>
      {/* Sin movimiento: las dos posiciones lado a lado. */}
      <div className="rep-estatica absolute inset-0 grid grid-cols-2">
        {imgs.map((src, i) => (
          <div key={src} className="relative border-black/20 first:border-r">
            {foto(src, i)}
            {detalle && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white">
                {i === 0 ? "Inicio" : "Final"}
              </span>
            )}
          </div>
        ))}
      </div>
      {detalle && (
        <>
          <div className="rep-animada pointer-events-none absolute bottom-2 left-2 h-6">
            {FASES.map((f, i) => (
              <span
                key={f}
                className={`rep-fase rep-fase-${i} absolute left-0 top-0 whitespace-nowrap rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white`}
              >
                {f}
              </span>
            ))}
          </div>
          <span className="pointer-events-none absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white">
            {pausado ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          </span>
          {/* Barra de ritmo: avanza durante la repetición. */}
          <span className="rep-animada absolute inset-x-0 bottom-0 h-1 bg-black/25" aria-hidden>
            <span className="rep-barra block h-full w-full bg-primary" />
          </span>
        </>
      )}
    </>
  );

  const clases = cn("foto-ej relative overflow-hidden rounded-2xl", pausado && "rep-pausada", className);
  if (!detalle) return <div className={clases}>{contenido}</div>;
  return (
    <button
      type="button"
      className={cn(clases, "block text-left")}
      onClick={() => setPausado((p) => !p)}
      aria-label={pausado ? "Reanudar la animación" : "Pausar la animación"}
      aria-pressed={pausado}
    >
      {contenido}
    </button>
  );
}
