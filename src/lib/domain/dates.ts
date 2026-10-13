import type { Weekday } from "./types";

/** Fechas como "YYYY-MM-DD" en hora local: evita sorpresas de zona horaria. */
export function hoyISO(d = new Date()): string {
  return aISO(d);
}

export function aISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function deISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(s: string, n: number): string {
  const d = deISO(s);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

export function diasEntre(a: string, b: string): number {
  const ms = deISO(b).getTime() - deISO(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function diaSemana(s: string): Weekday {
  return deISO(s).getDay() as Weekday;
}

/** Lunes de la semana de la fecha dada. */
export function inicioSemana(s: string): string {
  const wd = diaSemana(s);
  const offset = wd === 0 ? -6 : 1 - wd;
  return sumarDias(s, offset);
}

export const NOMBRE_DIA: Record<Weekday, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export const NOMBRE_DIA_CORTO: Record<Weekday, string> = {
  0: "D",
  1: "L",
  2: "M",
  3: "X",
  4: "J",
  5: "V",
  6: "S",
};

/** Orden de la semana empezando en lunes. */
export const SEMANA_LUNES: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function ordenarDias(dias: Weekday[]): Weekday[] {
  return [...new Set(dias)].sort((a, b) => SEMANA_LUNES.indexOf(a) - SEMANA_LUNES.indexOf(b));
}

export function formatoFecha(s: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return deISO(s).toLocaleDateString("es-ES", opts);
}
