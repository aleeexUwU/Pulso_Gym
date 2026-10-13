// Tras `next build` (exportación estática en out/), genera out/sw.js con la lista
// de archivos a precachear para que la app funcione sin conexión.
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const OUT = path.join(RAIZ, "out");

async function listar(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listar(p)));
    else out.push(p);
  }
  return out;
}

const archivos = (await listar(OUT)).map((f) => "/" + path.relative(OUT, f).split(path.sep).join("/"));
const esImagen = (f) => f.startsWith("/ejercicios/") && f.endsWith(".webp");
const esSplash = (f) => f.startsWith("/icons/splash-");
const precache = archivos
  // HTML, JS, CSS, fuentes, iconos y payloads RSC (.txt) para navegar sin conexión.
  .filter((f) => !esImagen(f) && !esSplash(f) && f !== "/sw.js" && !f.endsWith(".map"))
  .map((f) => (f.endsWith("/index.html") ? f.slice(0, -"index.html".length) : f));
const imagenes = archivos.filter(esImagen);

const hash = createHash("sha256");
for (const f of archivos.filter((f) => !esImagen(f) && f !== "/sw.js")) {
  const ruta = path.join(OUT, f);
  const s = await stat(ruta);
  hash.update(f + s.size);
}
const version = hash.digest("hex").slice(0, 12);

const plantilla = await readFile(path.join(RAIZ, "scripts/sw-template.js"), "utf8");
const sw = plantilla
  .replace("__VERSION__", version)
  .replace("__PRECACHE__", JSON.stringify([...new Set(precache)]))
  .replace("__IMAGENES__", JSON.stringify(imagenes));
await writeFile(path.join(OUT, "sw.js"), sw);
console.log(`sw.js generado: versión ${version}, ${precache.length} archivos de la app + ${imagenes.length} imágenes`);
