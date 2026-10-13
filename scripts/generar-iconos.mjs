// Genera iconos PNG (PWA, Apple) y pantallas de inicio de iOS a partir de scripts/icono.svg.
// Uso: node scripts/generar-iconos.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const svg = await readFile(path.join(RAIZ, "scripts/icono.svg"));
const out = (f) => path.join(RAIZ, "public/icons", f);

for (const s of [192, 512]) await sharp(svg).resize(s, s).png().toFile(out(`icon-${s}.png`));
// Maskable: el contenido dentro de la zona segura (80 %) sobre fondo sólido.
const interior = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#06060b" } })
  .composite([{ input: interior, gravity: "center" }])
  .png()
  .toFile(out("maskable-512.png"));
await sharp(svg).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
await sharp(svg).resize(32, 32).png().toFile(out("favicon-32.png"));

// Splash iOS (portrait) para tamaños de iPhone habituales.
const splash = [
  [1170, 2532], [1179, 2556], [1284, 2778], [1290, 2796], [1125, 2436], [828, 1792], [750, 1334], [1242, 2688],
];
for (const [w, h] of splash) {
  const logo = await sharp(svg).resize(Math.round(w * 0.32)).png().toBuffer();
  await sharp({ create: { width: w, height: h, channels: 4, background: "#06060b" } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(out(`splash-${w}x${h}.png`));
}
console.log("Iconos generados en public/icons");
