import { COLECCIONES, db } from "@/lib/db/db";
import { vivos } from "@/lib/db/repo";
import type { SyncMeta } from "@/lib/db/types";
import { hoyISO } from "@/lib/domain/dates";
import { getEjercicio } from "@/lib/domain/exercises";

function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function csv(filas: (string | number | null | undefined | boolean)[][]): string {
  const celda = (v: unknown) => {
    const t = v == null ? "" : String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  // Punto y coma: Excel en español lo abre directamente en columnas.
  return "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n");
}

/** Copia completa (todas las colecciones salvo los vídeos) en JSON. */
export async function exportarJSON(): Promise<void> {
  const datos: Record<string, unknown[]> = {};
  for (const c of COLECCIONES) datos[c] = vivos((await db().table(c).toArray()) as SyncMeta[]);
  descargar(`pulso-copia-${hoyISO()}.json`, JSON.stringify({ app: "pulso", version: 1, exportado: new Date().toISOString(), datos }, null, 2), "application/json");
}

/** Restaura una copia JSON (sustituye los registros con el mismo id). */
export async function importarJSON(archivo: File): Promise<number> {
  const json = JSON.parse(await archivo.text());
  if (json?.app !== "pulso" || !json.datos) throw new Error("No es una copia de esta app");
  let n = 0;
  for (const c of COLECCIONES) {
    const filas = (json.datos[c] ?? []) as SyncMeta[];
    await db().table(c).bulkPut(filas.map((f) => ({ ...f, _dirty: 1, updatedAt: Date.now() })));
    n += filas.length;
  }
  return n;
}

const nombre = (id: string) => getEjercicio(id)?.nombre ?? id;

export async function exportarCSV(tipo: "gimnasio" | "abdominales" | "brazo" | "peso"): Promise<void> {
  const d = db();
  if (tipo === "gimnasio") {
    const ws = vivos(await d.workouts.orderBy("fecha").toArray());
    const filas: (string | number | null | boolean)[][] = [["fecha", "sesion", "estado", "ejercicio", "serie", "peso_kg", "reps", "rir", "hecha", "descarga"]];
    for (const w of ws)
      for (const e of w.ejercicios)
        e.series.forEach((s, i) => filas.push([w.fecha, w.nombre, w.estado, nombre(e.exerciseId), i + 1, s.pesoKg, s.reps, s.rir, s.hecho, w.descarga]));
    return descargar(`pulso-gimnasio-${hoyISO()}.csv`, csv(filas), "text/csv");
  }
  if (tipo === "abdominales") {
    const ss = vivos(await d.absSessions.orderBy("fecha").toArray());
    const filas: (string | number | boolean)[][] = [["fecha", "completada", "ejercicio", "series_objetivo", "series_hechas", "objetivo", "medida", "duracion_seg"]];
    for (const s of ss) for (const it of s.items) filas.push([s.fecha, s.completado, nombre(it.exerciseId), it.series, it.hechas, it.objetivo, it.medida, s.duracionSeg]);
    return descargar(`pulso-core-${hoyISO()}.csv`, csv(filas), "text/csv");
  }
  if (tipo === "brazo") {
    const ss = vivos(await d.armSessions.orderBy("fecha").toArray());
    const filas: (string | number | null | boolean)[][] = [["fecha", "dolor_antes", "dolor_despues", "ejercicio", "serie", "valor", "medida", "carga", "hecha"]];
    for (const s of ss)
      for (const e of s.entradas) e.series.forEach((x, i) => filas.push([s.fecha, s.dolorAntes, s.dolorDespues, e.nombre, i + 1, x.valor, e.medida, x.carga, x.hecho]));
    return descargar(`pulso-brazo-${hoyISO()}.csv`, csv(filas), "text/csv");
  }
  const ps = vivos(await d.bodyweights.orderBy("fecha").toArray());
  return descargar(`pulso-peso-${hoyISO()}.csv`, csv([["fecha", "kg"], ...ps.map((p) => [p.fecha, p.kg])]), "text/csv");
}
