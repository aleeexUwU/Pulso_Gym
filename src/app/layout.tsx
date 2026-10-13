import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Nosifer } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Títulos: Bebas Neue (afilada, con efecto glitch). Logo: Nosifer (solo el logotipo). Texto: Inter.
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin", "latin-ext"], weight: "400", display: "swap" });
const nosifer = Nosifer({ variable: "--font-nosifer", subsets: ["latin"], weight: "400", display: "swap" });

const SPLASH: [number, number, number, number][] = [
  // [ancho px, alto px, ancho css, alto css] → media query de iOS
  [1290, 2796, 430, 932],
  [1179, 2556, 393, 852],
  [1284, 2778, 428, 926],
  [1170, 2532, 390, 844],
  [1125, 2436, 375, 812],
  [1242, 2688, 414, 896],
  [828, 1792, 414, 896],
  [750, 1334, 375, 667],
];

export const metadata: Metadata = {
  title: { default: "Pulso · Entreno", template: "%s · Pulso" },
  description: "Entrenamiento personal adaptado: gimnasio con el brazo derecho, core diario en casa y módulo de brazo izquierdo.",
  applicationName: "Pulso",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Pulso",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH.map(([w, h, cw, ch]) => ({
      url: `/icons/splash-${w}x${h}.png`,
      media: `(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${Math.round(w / cw)}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#120e0f",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${bebas.variable} ${nosifer.variable} dark`}
      suppressHydrationWarning
    >
      <body className="app-bg">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
