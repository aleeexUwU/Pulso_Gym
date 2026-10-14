"use client";

import createBodyHighlighter, { type IExerciseData } from "body-highlighter";
import { useEffect, useRef } from "react";
import type { Exercise, MuscleGroup } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Grupos de la app → zonas del mapa de body-highlighter (MIT). */
const ZONAS: Record<MuscleGroup, string[]> = {
  pecho: ["chest"],
  dorsal: ["upper-back"],
  espalda_alta: ["trapezius"],
  hombro_anterior: ["front-deltoids"],
  hombro_lateral: ["front-deltoids", "back-deltoids"],
  hombro_posterior: ["back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebrazo: ["forearm"],
  cuadriceps: ["quadriceps"],
  isquios: ["hamstring"],
  gluteos: ["gluteal"],
  aductores: ["adductor"],
  abductores: ["abductors"],
  gemelos: ["calves"],
  lumbar: ["lower-back"],
  core: ["abs", "obliques"],
};

// Colores exactos (en rgb) para reconocer después qué polígonos son "principales".
const PRINCIPAL = "rgb(232, 52, 74)";
const SECUNDARIO = "rgb(150, 70, 82)";
const CUERPO = "rgb(74, 66, 68)";

/**
 * Silueta de frente y de espaldas con los músculos del ejercicio: principales en
 * carmesí latiendo (como si se contrajeran) y secundarios en un tono más apagado.
 */
export function MapaMuscular({ ejercicio, className }: { ejercicio: Exercise; className?: string }) {
  const frente = useRef<HTMLDivElement>(null);
  const espalda = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const principales = new Set<string>();
    const secundarios = new Set<string>();
    for (const [g, w] of Object.entries(ejercicio.musculos) as [MuscleGroup, number][]) {
      for (const z of ZONAS[g] ?? []) (w >= 1 ? principales : secundarios).add(z);
    }
    for (const z of principales) secundarios.delete(z);
    // La librería colorea por frecuencia: principal = 2 apariciones, secundario = 1.
    const data: IExerciseData[] = [
      { name: "principal", muscles: [...principales] as IExerciseData["muscles"] },
      { name: "principal-2", muscles: [...principales] as IExerciseData["muscles"] },
      { name: "secundario", muscles: [...secundarios] as IExerciseData["muscles"] },
    ];
    const instancias = (
      [
        [frente.current, "anterior"],
        [espalda.current, "posterior"],
      ] as const
    ).flatMap(([el, tipo]) => {
      if (!el) return [];
      const h = createBodyHighlighter({
        container: el,
        data,
        type: tipo,
        bodyColor: CUERPO,
        highlightedColors: [SECUNDARIO, PRINCIPAL],
        style: { width: "100%", height: "100%" },
      });
      el.querySelectorAll<SVGPolygonElement>("polygon").forEach((p) => {
        p.style.cursor = "default";
        if (p.style.fill === PRINCIPAL) p.classList.add("musculo-principal");
      });
      return [h];
    });
    return () => instancias.forEach((h) => h.destroy());
  }, [ejercicio]);

  return (
    <div
      className={cn("mapa-muscular grid grid-cols-2 content-center gap-1 rounded-2xl border border-border bg-popover px-1.5 py-2", className)}
      aria-label="Músculos que trabaja"
      role="img"
    >
      <figure className="flex flex-col items-center gap-1">
        <div ref={frente} className="aspect-[1/2] w-full" />
        <figcaption className="text-[10px] text-muted-foreground">Delante</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-1">
        <div ref={espalda} className="aspect-[1/2] w-full" />
        <figcaption className="text-[10px] text-muted-foreground">Detrás</figcaption>
      </figure>
    </div>
  );
}
