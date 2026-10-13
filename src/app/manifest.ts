import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "vl3x-GYM · Entreno personal",
    short_name: "vl3x-GYM",
    description: "Gimnasio adaptado con el brazo derecho, core diario en casa y módulo de brazo izquierdo.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0909",
    theme_color: "#120e0f",
    categories: ["health", "fitness", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Entrenar hoy", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Abdominales", url: "/abdominales/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
