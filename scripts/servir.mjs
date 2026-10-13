// Servidor estático mínimo para probar la exportación (out/) como en producción.
// Uso: npm run preview  →  http://localhost:4173
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
const PUERTO = Number(process.env.PORT ?? 4173);
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/x-component",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let ruta = path.join(OUT, decodeURIComponent(url.pathname));
  if (!ruta.startsWith(OUT)) return res.writeHead(403).end();
  try {
    if ((await stat(ruta)).isDirectory()) ruta = path.join(ruta, "index.html");
  } catch {
    if (!path.extname(ruta)) ruta = path.join(ruta, "index.html");
  }
  try {
    const datos = await readFile(ruta);
    const cabeceras = { "Content-Type": TIPOS[path.extname(ruta)] ?? "application/octet-stream" };
    if (ruta.endsWith("sw.js")) cabeceras["Cache-Control"] = "no-cache";
    res.writeHead(200, cabeceras).end(datos);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(await readFile(path.join(OUT, "404.html")).catch(() => "404"));
  }
}).listen(PUERTO, () => console.log(`Sirviendo out/ en http://localhost:${PUERTO}`));
