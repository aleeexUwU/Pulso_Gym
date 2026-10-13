"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Ojo estilizado de diseño propio: esclerótica negra, iris carmesí con brillo y
 * venas finas. Puramente decorativo (aria-hidden). Parpadea despacio salvo con
 * movimiento reducido.
 */
export function Kakugan({ className, parpadeo = true }: { className?: string; parpadeo?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 120" className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <radialGradient id={`iris-${id}`} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#ff5a66" />
          <stop offset="0.45" stopColor="#e3142f" />
          <stop offset="1" stopColor="#5e0612" />
        </radialGradient>
        <filter id={`brillo-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`ojo-${id}`}>
          <path d="M8 60 Q100 -6 192 60 Q100 126 8 60Z" />
        </clipPath>
      </defs>
      <g className={parpadeo ? "ojo-parpado" : undefined}>
        <path d="M8 60 Q100 -6 192 60 Q100 126 8 60Z" fill="#070506" stroke="#efe6d2" strokeOpacity="0.35" strokeWidth="2" />
        <g clipPath={`url(#ojo-${id})`}>
          <g stroke="#c4142f" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M66 52 Q48 46 30 52 Q22 55 14 52" />
            <path d="M68 70 Q50 78 34 74" />
            <path d="M134 50 Q152 42 170 48 Q178 50 186 46" />
            <path d="M132 72 Q150 80 168 76" />
            <path d="M40 74 Q36 80 28 82" />
            <path d="M158 46 Q162 38 170 36" />
          </g>
          <circle cx="100" cy="60" r="33" fill={`url(#iris-${id})`} filter={`url(#brillo-${id})`} />
          <circle cx="100" cy="60" r="33" fill="none" stroke="#2a0207" strokeWidth="3" />
          <ellipse cx="100" cy="60" rx="6" ry="13" fill="#070506" />
          <circle cx="90" cy="49" r="4.5" fill="#fff4f0" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

/** Logotipo: ojo + "PULSO" en Nosifer (la fuente solo se usa aquí). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Kakugan className="h-6 w-10" />
      <span className="font-logo text-lg tracking-wider text-primary" aria-label="Pulso">
        PULSO
      </span>
    </span>
  );
}
