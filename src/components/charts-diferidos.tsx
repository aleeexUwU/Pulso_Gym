"use client";

import dynamic from "next/dynamic";

/**
 * Las gráficas (Recharts, ~390 KB) se cargan solo cuando hacen falta, no al abrir
 * Dieta o Progreso. Mientras llegan, un hueco del mismo alto para que nada salte.
 */
const Hueco = () => <div className="h-56 animate-pulse rounded-2xl bg-secondary/40" aria-hidden />;

export const GraficaBarras = dynamic(() => import("@/components/charts").then((m) => m.GraficaBarras), {
  ssr: false,
  loading: Hueco,
});

export const GraficaLineas = dynamic(() => import("@/components/charts").then((m) => m.GraficaLineas), {
  ssr: false,
  loading: Hueco,
});
