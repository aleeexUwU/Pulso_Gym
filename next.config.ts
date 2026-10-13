import type { NextConfig } from "next";

// Exportación estática: toda la app es cliente (IndexedDB + Supabase opcional),
// así el service worker puede precachear cada página y funciona sin conexión.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
