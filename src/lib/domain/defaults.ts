import { inicioSemana, hoyISO } from "./dates";
import { LIMITACIONES_POR_DEFECTO } from "./limitations";
import { EQUIPO_GIMNASIO_COMPLETO } from "./muscles";
import { AJUSTES_DIETA_POR_DEFECTO } from "./nutrition/objetivos";
import { INCREMENTOS_POR_DEFECTO } from "./progression";
import type { Profile, Settings } from "./types";

export function perfilPorDefecto(): Profile {
  return {
    nombre: "",
    edad: null,
    pesoKg: null,
    alturaCm: null,
    sexo: "hombre",
    experiencia: "principiante",
    objetivo: "hipertrofia",
    dias: [6, 0],
    duracionMin: 90,
    equipo: EQUIPO_GIMNASIO_COMPLETO,
    limitaciones: [...LIMITACIONES_POR_DEFECTO],
    notasLimitaciones:
      "Mano zamba radial congénita en el brazo izquierdo: tren superior solo con el brazo derecho; no agarrar ni apoyar peso con la mano izquierda.",
    excluidos: [],
    avisoMedicoAceptado: false,
    creadoEn: new Date().toISOString(),
  };
}

export function ajustesPorDefecto(hoy = hoyISO()): Settings {
  return {
    seriesMinimas: 10,
    incrementos: { ...INCREMENTOS_POR_DEFECTO },
    semanasDescarga: 7,
    // El módulo brazo izquierdo empieza DESACTIVADO.
    moduloBrazo: false,
    abdominalesDiasSemana: 7,
    recordatorio: { activo: false, hora: "20:00" },
    inicioPrograma: inicioSemana(hoy),
    ultimaDescarga: null,
    descargaHasta: null,
    inicioAbdominales: hoy,
    sonido: true,
    vibracion: true,
    biseries: true,
    equipoCasa: ["esterilla"],
    diasBrazo: [],
    tema: "oscuro",
    dieta: { ...AJUSTES_DIETA_POR_DEFECTO },
  };
}
