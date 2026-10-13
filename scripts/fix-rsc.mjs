// Next 16 (exportación estática) escribe los payloads RSC de cada segmento en carpetas
// (`ajustes/__next.ajustes/__PAGE__.txt`), pero el cliente los pide con puntos
// (`ajustes/__next.ajustes.__PAGE__.txt`) al precargar enlaces → 404 en el servidor.
// Este paso crea la copia con el nombre plano junto a la original.
import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");

async function listar(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listar(p)));
    else out.push(p);
  }
  return out;
}

let n = 0;
for (const f of await listar(OUT)) {
  if (!f.endsWith(".txt")) continue;
  const partes = path.relative(OUT, f).split(path.sep);
  const i = partes.findIndex((p, k) => p.startsWith("__next.") && k < partes.length - 1);
  if (i < 0) continue;
  const plano = path.join(OUT, ...partes.slice(0, i), partes.slice(i).join("."));
  await copyFile(f, plano);
  n++;
}
console.log(`fix-rsc: ${n} payloads RSC copiados con nombre plano`);
