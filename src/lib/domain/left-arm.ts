/**
 * Módulo brazo izquierdo. Desactivado por defecto: no aparece en la navegación ni
 * en el plan semanal hasta que se activa en Ajustes. El catálogo de ideas está aquí
 * en código pero NO se carga en la base de datos salvo que se importe con el botón.
 */

export type Respuesta3 = "si" | "parcial" | "no";

export interface ArmAssessment {
  fecha: string;
  agarra: Respuesta3;
  flexionaCodo: Respuesta3;
  extiendeCodo: Respuesta3;
  elevaPorEncimaHombro: Respuesta3;
  rotaHombro: Respuesta3;
  /** Apoyar el antebrazo (plancha) resulta cómodo. Lo usa también el módulo de abdominales. */
  apoyoAntebrazoComodo: Respuesta3;
  dolorReposo: number;
  dolorMovimiento: number;
  notas: string;
}

export interface ArmRequirements {
  agarre?: boolean;
  flexionCodo?: boolean;
  extensionCodo?: boolean;
  elevacionHombro?: boolean;
  rotacionHombro?: boolean;
}

export interface ArmCatalogItem {
  id: string;
  nombre: string;
  zona: "hombro_escapula" | "codo" | "mano_muneca";
  descripcion: string;
  medida: "reps" | "segundos";
  series: number;
  objetivo: number;
  carga: string;
  ilustracion: string;
  requiere: ArmRequirements;
}

export const CATALOGO_BRAZO_IZQUIERDO: ArmCatalogItem[] = [
  {
    id: "bi_retraccion_escapular",
    nombre: "Retracciones escapulares",
    zona: "hombro_escapula",
    descripcion: "De pie o sentado, junta los omóplatos hacia atrás y abajo, aguanta 3 s y suelta. Sin peso.",
    medida: "reps",
    series: 2,
    objetivo: 12,
    carga: "Sin carga",
    ilustracion: "retraccion",
    requiere: {},
  },
  {
    id: "bi_elevacion_lateral_sin_peso",
    nombre: "Elevación lateral sin peso",
    zona: "hombro_escapula",
    descripcion: "Sube el brazo hacia el lado hasta donde sea cómodo (máximo a la altura del hombro) y baja despacio.",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "Sin carga",
    ilustracion: "elevacion_lateral",
    requiere: {},
  },
  {
    id: "bi_elevacion_lateral_muniequera",
    nombre: "Elevación lateral con lastre en el antebrazo",
    zona: "hombro_escapula",
    descripcion:
      "Como la anterior pero con una tobillera/muñequera lastrada colocada en el antebrazo, por encima de la muñeca (nunca en la mano).",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "0,5 kg en el antebrazo",
    ilustracion: "elevacion_lateral",
    requiere: {},
  },
  {
    id: "bi_elevacion_frontal",
    nombre: "Elevación frontal sin peso o con lastre en el brazo",
    zona: "hombro_escapula",
    descripcion: "Sube el brazo al frente hasta la altura del hombro, sin forzar, y baja en 3 s.",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "Sin carga",
    ilustracion: "elevacion_frontal",
    requiere: {},
  },
  {
    id: "bi_polea_correa_tobillo",
    nombre: "Abducción de hombro en polea con correa de tobillo en el brazo",
    zona: "hombro_escapula",
    descripcion:
      "Engancha la correa de tobillo de la polea baja alrededor del brazo (por encima del codo) y separa el brazo del cuerpo. Peso mínimo.",
    medida: "reps",
    series: 2,
    objetivo: 12,
    carga: "Placa mínima",
    ilustracion: "elevacion_lateral",
    requiere: {},
  },
  {
    id: "bi_rotacion_externa_banda",
    nombre: "Rotación externa con banda rodeando el antebrazo",
    zona: "hombro_escapula",
    descripcion:
      "Codo pegado al cuerpo a 90°, la banda rodea el antebrazo (no hay que agarrarla). Gira el antebrazo hacia fuera y vuelve.",
    medida: "reps",
    series: 2,
    objetivo: 12,
    carga: "Banda muy ligera",
    ilustracion: "rotacion",
    requiere: { rotacionHombro: true, flexionCodo: true },
  },
  {
    id: "bi_elevacion_por_encima",
    nombre: "Elevación por encima de la cabeza asistida",
    zona: "hombro_escapula",
    descripcion: "Desliza el brazo por una pared hacia arriba hasta donde sea cómodo. Movilidad, sin carga.",
    medida: "reps",
    series: 2,
    objetivo: 8,
    carga: "Sin carga",
    ilustracion: "elevacion_frontal",
    requiere: { elevacionHombro: true },
  },
  {
    id: "bi_flexion_codo_banda",
    nombre: "Flexión de codo con banda en el antebrazo",
    zona: "codo",
    descripcion: "Pisa una banda ligera y rodea con ella el antebrazo por encima de la muñeca. Dobla el codo y baja despacio.",
    medida: "reps",
    series: 2,
    objetivo: 12,
    carga: "Banda ligera",
    ilustracion: "flexion_codo",
    requiere: { flexionCodo: true },
  },
  {
    id: "bi_flexion_codo_muniequera",
    nombre: "Flexión de codo con muñequera lastrada",
    zona: "codo",
    descripcion: "Muñequera lastrada colocada por encima de la muñeca. Dobla el codo despacio sin cargar la mano.",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "0,5 kg",
    ilustracion: "flexion_codo",
    requiere: { flexionCodo: true },
  },
  {
    id: "bi_extension_codo_banda",
    nombre: "Extensión de codo con banda en el antebrazo",
    zona: "codo",
    descripcion: "Banda anclada en alto rodeando el antebrazo. Estira el codo hacia abajo y vuelve despacio.",
    medida: "reps",
    series: 2,
    objetivo: 12,
    carga: "Banda ligera",
    ilustracion: "extension_codo",
    requiere: { extensionCodo: true },
  },
  {
    id: "bi_isometrico_pared",
    nombre: "Isométricos de codo contra la pared",
    zona: "codo",
    descripcion: "Empuja suavemente con el antebrazo contra la pared (hacia arriba, abajo, dentro y fuera) 10 s cada dirección.",
    medida: "segundos",
    series: 2,
    objetivo: 10,
    carga: "Esfuerzo suave (3/10)",
    ilustracion: "isometrico",
    requiere: {},
  },
  {
    id: "bi_movilidad_muneca",
    nombre: "Movilidad suave de muñeca y dedos",
    zona: "mano_muneca",
    descripcion: "Movimientos lentos de muñeca y dedos dentro del rango cómodo. Nunca forzar la desviación.",
    medida: "segundos",
    series: 2,
    objetivo: 30,
    carga: "Sin carga",
    ilustracion: "movilidad_muneca",
    requiere: {},
  },
  {
    id: "bi_estiramiento_suave",
    nombre: "Estiramientos suaves de antebrazo",
    zona: "mano_muneca",
    descripcion: "Con la mano derecha, acompaña suavemente la muñeca izquierda en su rango cómodo. 20–30 s, sin dolor.",
    medida: "segundos",
    series: 2,
    objetivo: 20,
    carga: "Sin carga",
    ilustracion: "movilidad_muneca",
    requiere: {},
  },
  {
    id: "bi_agarre_pelota",
    nombre: "Agarre con pelota blanda o masilla",
    zona: "mano_muneca",
    descripcion: "Aprieta una pelota antiestrés o masilla terapéutica 3 s y suelta.",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "Masilla blanda",
    ilustracion: "agarre",
    requiere: { agarre: true },
  },
];

const puede = (r: Respuesta3) => r !== "no";

/** Ejercicios del catálogo compatibles con la autoevaluación. Con dolor en reposo > 3, solo movilidad. */
export function ejerciciosCompatibles(ev: ArmAssessment): ArmCatalogItem[] {
  return CATALOGO_BRAZO_IZQUIERDO.filter((it) => {
    const r = it.requiere;
    if (r.agarre && !puede(ev.agarra)) return false;
    if (r.flexionCodo && !puede(ev.flexionaCodo)) return false;
    if (r.extensionCodo && !puede(ev.extiendeCodo)) return false;
    if (r.elevacionHombro && !puede(ev.elevaPorEncimaHombro)) return false;
    if (r.rotacionHombro && !puede(ev.rotaHombro)) return false;
    if (ev.dolorReposo > 3 && it.carga !== "Sin carga") return false;
    return true;
  });
}

/** Mensaje de seguridad según el dolor (escala 0–10). */
export function avisoDolor(dolor: number): { nivel: "ok" | "precaucion" | "parar"; mensaje: string } {
  if (dolor > 5) return { nivel: "parar", mensaje: "Dolor alto: para la sesión de hoy y consúltalo con tu fisioterapeuta." };
  if (dolor > 3) return { nivel: "precaucion", mensaje: "Dolor por encima de 3: baja la carga o las repeticiones, o para por hoy." };
  return { nivel: "ok", mensaje: "Dolor bajo control. Sigue sin forzar." };
}

export function evaluacionVacia(fecha: string): ArmAssessment {
  return {
    fecha,
    agarra: "parcial",
    flexionaCodo: "si",
    extiendeCodo: "si",
    elevaPorEncimaHombro: "parcial",
    rotaHombro: "parcial",
    apoyoAntebrazoComodo: "no",
    dolorReposo: 0,
    dolorMovimiento: 0,
    notas: "",
  };
}
