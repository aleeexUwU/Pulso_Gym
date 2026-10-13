"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { imagenesEjercicio } from "@/lib/domain/exercises";
import type { Exercise } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Ilustracion } from "./illustration";

/**
 * Imagen secuencial: alterna las fotos de posición inicial y final (de
 * free-exercise-db) como una animación. Sin foto, ilustración SVG propia.
 */
export function ExerciseImage({
  ejercicio,
  className,
  animar = true,
}: {
  ejercicio: Exercise;
  className?: string;
  animar?: boolean;
}) {
  const imgs = imagenesEjercicio(ejercicio);
  const [frame, setFrame] = useState(0);
  const [error, setError] = useState(false);

  const conFoto = Boolean(ejercicio.imagen);
  useEffect(() => {
    if (!conFoto || !animar) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % 2), 1100);
    return () => clearInterval(t);
  }, [conFoto, animar]);

  if (!imgs || error) {
    return (
      <div className={cn("grid place-items-center overflow-hidden rounded-2xl bg-secondary/60", className)}>
        <Ilustracion clave={ejercicio.ilustracion} className="h-full max-h-56 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-white", className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={frame}
          src={imgs[frame]}
          alt={`${ejercicio.nombre}: ${frame === 0 ? "posición inicial" : "posición final"}`}
          className="absolute inset-0 size-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
        />
      </AnimatePresence>
      {animar && <span className="absolute bottom-1.5 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
        {frame === 0 ? "Inicio" : "Final"}
      </span>}
    </div>
  );
}
