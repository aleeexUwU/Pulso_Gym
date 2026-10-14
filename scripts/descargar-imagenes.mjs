// Descarga las imágenes de los ejercicios desde yuhonas/free-exercise-db (dominio
// público, licencia Unlicense) y las guarda optimizadas en WebP en public/ejercicios.
// Uso: node scripts/descargar-imagenes.mjs [--forzar]   (--forzar vuelve a bajar las que ya hay)
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "..");
const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const fuentes = ["src/lib/domain/exercises/gym.ts", "src/lib/domain/exercises/abs.ts"];

const ids = new Set();
for (const f of fuentes) {
  const txt = await readFile(path.join(RAIZ, f), "utf8");
  for (const m of txt.matchAll(/imagen:\s*"([^"]+)"/g)) ids.add(m[1]);
}
console.log(`${ids.size} ejercicios con imagen`);

let fallos = 0;
for (const id of ids) {
  const dir = path.join(RAIZ, "public", "ejercicios", id);
  await mkdir(dir, { recursive: true });
  for (const n of [0, 1]) {
    const destino = path.join(dir, `${n}.webp`);
    if (!process.argv.includes("--forzar")) {
      try {
        await access(destino);
        continue;
      } catch {}
    }
    const res = await fetch(`${BASE}/${id}/${n}.jpg`);
    if (!res.ok) {
      console.error(`✗ ${id}/${n}.jpg → ${res.status}`);
      fallos++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(destino, await sharp(buf).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 76 }).toBuffer());
  }
  process.stdout.write(".");
}
console.log(`\nListo. Fallos: ${fallos}`);
process.exit(fallos ? 1 : 0);
