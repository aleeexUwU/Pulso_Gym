import type { Exercise, Measure } from "./types";

/**
 * Consejos rápidos para tener a mano DURANTE la serie: cómo preparar la máquina,
 * qué pensar mientras se hace el movimiento y qué hacer si no notas el músculo.
 * Escritos para hacerlo con el brazo derecho y la mano izquierda libre.
 */
export interface ConsejosEjercicio {
  /** Antes de empezar: asiento, altura de la polea, agarre, posición. */
  prepara: string[];
  /** Ideas para tener en la cabeza en cada repetición. */
  claves: string[];
  /** Si no notas el músculo que toca. */
  siNoLoNotas?: string;
}

const MANO_IZQ = "La mano izquierda descansa en el muslo o en el asiento, sin agarrar nada.";

export const CONSEJOS: Record<string, ConsejosEjercicio> = {
  // ── Pecho ──
  press_pecho_maquina_una_mano: {
    prepara: [
      "Sube o baja el asiento hasta que los agarres queden a la altura del centro del pecho, no del cuello.",
      "Espalda pegada al respaldo y pies firmes en el suelo.",
      MANO_IZQ,
    ],
    claves: [
      "Saca pecho y junta el omóplato derecho hacia la columna antes de empujar, y mantenlo así.",
      "Empuja hasta casi estirar el codo, sin bloquearlo.",
      "Vuelve despacio (2-3 s) hasta notar el pecho estirado.",
    ],
    siNoLoNotas: "Si lo notas solo en el hombro, baja un punto el asiento y no dejes que el hombro se adelante al final del empuje.",
  },
  contractora_una_mano: {
    prepara: [
      "Asiento a una altura en la que el agarre quede a la altura del pecho, con el codo un poco flexionado.",
      "Siéntate de lado si la máquina solo deja hacerlo así; lo importante es que el brazo se abra en línea con el pecho.",
    ],
    claves: [
      "Piensa en llevar el codo hacia el centro, no la mano.",
      "Aprieta 1 s cuando el brazo cruce delante del pecho.",
      "Abre despacio hasta notar el estiramiento sin pasar el brazo por detrás del cuerpo.",
    ],
    siNoLoNotas: "Baja el peso: en la contractora se nota mucho más con peso moderado y pausa al cerrar.",
  },

  // ── Espalda ──
  jalon_maquina_una_mano: {
    prepara: [
      "Ajusta el rodillo para que te sujete bien los muslos y no te levantes al tirar.",
      "Agarra la palanca derecha con el brazo estirado y el hombro arriba.",
      MANO_IZQ,
    ],
    claves: [
      "Primero baja el hombro (aléjalo de la oreja) y después tira con el codo hacia el costado.",
      "Imagina que la mano es un gancho: tira con el codo, no con el bíceps.",
      "Sube despacio hasta notar el dorsal estirado.",
    ],
    siNoLoNotas: "Si solo trabaja el bíceps, coge el agarre más suelto (sin apretar el puño) y lleva el codo hacia el bolsillo.",
  },
  jalon_polea_una_mano: {
    prepara: [
      "Usa un estribo (agarre de una mano) en la polea alta.",
      "Siéntate o arrodíllate con el cable justo encima del hombro derecho.",
      MANO_IZQ,
    ],
    claves: [
      "Baja primero el hombro y luego lleva el codo hacia el costado.",
      "Gira un poco la palma hacia ti al final del recorrido.",
      "Sube despacio dejando que el brazo se estire del todo.",
    ],
    siNoLoNotas: "Inclínate un poco hacia el lado izquierdo para que el dorsal se estire más arriba.",
  },
  remo_maquina_una_mano: {
    prepara: [
      "Ajusta el asiento para que el agarre quede a la altura del pecho y el apoyo pegado al esternón.",
      "Pecho siempre apoyado: así la espalda baja no trabaja y es más fácil sentir el dorsal.",
      MANO_IZQ,
    ],
    claves: [
      "Tira del codo hacia atrás y hacia la cadera, pegado al cuerpo.",
      "Junta el omóplato hacia la columna al final y aguanta 1 s.",
      "Deja que el hombro vaya hacia delante al volver para estirar la espalda.",
    ],
    siNoLoNotas: "Si lo notas en el trapecio, no subas el hombro: llévalo hacia atrás y abajo.",
  },
  remo_polea_baja_una_mano: {
    prepara: ["Estribo en la polea baja, pies apoyados y rodillas un poco flexionadas.", "Espalda recta, sin redondearla al estirar."],
    claves: [
      "Tira del codo hacia la cadera, rozando el costado.",
      "No balancees el tronco: muévete solo con el brazo y el omóplato.",
      "Al volver, deja que el hombro se adelante un poco para estirar.",
    ],
  },
  face_pull_una_mano: {
    prepara: [
      "Polea a la altura de la cara con un estribo (la cuerda a una mano es incómoda).",
      "Ponte un poco girado, con el hombro derecho hacia la polea, para que el cable vaya en línea con el brazo.",
    ],
    claves: [
      "Tira hacia la cara con el codo alto y hacia fuera, a la altura del hombro.",
      "Al final gira el antebrazo hacia arriba, como enseñando el bíceps, y junta el omóplato.",
      "Poco peso y 12-15 repeticiones controladas.",
    ],
    siNoLoNotas: "Si se convierte en un remo, es que bajas el codo: quita peso y mantenlo a la altura del hombro.",
  },
  remo_alto_polea_una_mano: {
    prepara: ["Polea a la altura del pecho con un estribo.", "Codo abierto hacia fuera desde el principio."],
    claves: ["Tira con el codo hacia atrás y hacia fuera, a la altura del hombro.", "Junta el omóplato al final y vuelve despacio."],
  },
  encogimiento_polea: {
    prepara: ["Polea baja con estribo, de pie y de lado a la máquina.", "Brazo estirado y relajado: el brazo solo sujeta."],
    claves: ["Sube el hombro hacia la oreja en línea recta, sin hacer círculos.", "Aguanta 1 s arriba y baja despacio."],
  },

  // ── Hombro ──
  press_hombro_maquina_una_mano: {
    prepara: [
      "Asiento a una altura en la que el agarre quede a la altura del hombro o un poco por debajo.",
      "Espalda pegada al respaldo; no arquees la zona lumbar.",
      MANO_IZQ,
    ],
    claves: [
      "Empuja hacia arriba hasta casi estirar el codo.",
      "Baja controlando hasta que la mano quede a la altura de la oreja.",
      "Codo un poco por delante del cuerpo, no totalmente abierto.",
    ],
  },
  elevacion_lateral_polea: {
    prepara: [
      "Polea en la posición más baja con un estribo.",
      "Colócate de lado con el hombro izquierdo hacia la polea; el cable pasa por delante del cuerpo hacia la mano derecha.",
      "Puedes apoyarte en la máquina con el antebrazo o el hombro izquierdo, sin agarrar.",
    ],
    claves: [
      "Sube el brazo hacia el lado guiando con el codo, hasta la altura del hombro.",
      "El meñique ligeramente más alto que el pulgar al subir.",
      "Baja despacio; la tensión del cable abajo es lo bueno de este ejercicio.",
    ],
    siNoLoNotas: "Si lo notas en el trapecio, baja el peso y piensa en alejar la mano del cuerpo, no en subirla.",
  },
  contractora_inversa_una_mano: {
    prepara: [
      "Siéntate mirando al respaldo con el pecho apoyado.",
      "Asiento a una altura en la que el agarre quede a la altura del hombro.",
      MANO_IZQ,
    ],
    claves: [
      "Abre el brazo hacia atrás en arco, con el codo un poco flexionado y fijo.",
      "Piensa en empujar hacia atrás con el dorso de la mano, no en tirar.",
      "Para cuando el brazo quede en línea con el cuerpo y vuelve despacio.",
    ],
    siNoLoNotas: "Si lo notas en el trapecio, no juntes tanto el omóplato: el movimiento es del hombro.",
  },
  pajaro_polea_una_mano: {
    prepara: ["Polea a la altura del hombro, sin agarre (coge la bola del cable) o con estribo.", "Cable cruzado por delante del cuerpo."],
    claves: ["Abre el brazo hacia atrás en arco con el codo casi estirado.", "Controla la vuelta, sin dejar que el cable te arrastre."],
  },

  // ── Brazos ──
  curl_maquina_una_mano: {
    prepara: [
      "Ajusta el asiento para que la axila quede apoyada al borde del cojín y el codo alineado con el eje de la máquina.",
      MANO_IZQ,
    ],
    claves: [
      "Sube la mano hacia el hombro sin despegar el brazo del cojín.",
      "Aprieta 1 s arriba.",
      "Baja despacio hasta casi estirar el brazo del todo.",
    ],
    siNoLoNotas: "Si te duele el codo, revisa que esté justo en el eje de giro de la máquina.",
  },
  curl_polea_una_mano: {
    prepara: ["Polea baja con estribo, de pie mirando a la máquina.", "Codo pegado al costado y un paso atrás para que el cable tenga tensión."],
    claves: ["Sube sin mover el codo hacia delante.", "Gira la palma hacia arriba al subir.", "Baja despacio hasta estirar."],
  },
  extension_triceps_polea_una_mano: {
    prepara: ["Polea alta con estribo.", "Codo pegado al costado durante todo el ejercicio."],
    claves: [
      "Empuja hacia abajo hasta estirar el brazo del todo y aprieta 1 s.",
      "Sube solo hasta que el antebrazo quede paralelo al suelo.",
      "El codo no se mueve: solo se mueve el antebrazo.",
    ],
    siNoLoNotas: "Si el hombro empuja, quita peso e inclínate un poco hacia delante.",
  },
  extension_triceps_overhead_polea: {
    prepara: ["Polea baja con estribo, de espaldas a la máquina.", "Codo apuntando al techo, junto a la cabeza."],
    claves: ["Estira el brazo hacia arriba sin mover el codo.", "Baja despacio hasta notar el tríceps estirado."],
  },
  curl_muneca_mancuerna: {
    prepara: [
      "Siéntate y apoya el antebrazo derecho en el muslo o en el banco, con la muñeca fuera del borde.",
      "Palma hacia arriba; mancuerna ligera.",
    ],
    claves: [
      "Deja que la mancuerna ruede hacia los dedos al bajar y ciérrala al subir.",
      "Sube flexionando solo la muñeca; el antebrazo no se despega.",
      "Repeticiones lentas, 15-20 y nota el ardor.",
    ],
  },
  extension_muneca_mancuerna: {
    prepara: ["Antebrazo apoyado en el muslo o en el banco con la palma hacia abajo.", "Usa bastante menos peso que en el curl de muñeca."],
    claves: ["Sube el dorso de la mano hacia ti, solo con la muñeca.", "Baja despacio; aquí cuesta más, no tengas prisa."],
  },

  // ── Pierna ──
  prensa: {
    prepara: [
      "Respaldo a una inclinación cómoda; espalda y cadera bien pegadas.",
      "Pies en el centro de la plataforma, a la anchura de las caderas.",
      "La mano izquierda puede ir al muslo; con la derecha sujeta el agarre lateral si lo necesitas.",
    ],
    claves: [
      "Baja hasta que las rodillas formen unos 90° o hasta antes de que se despegue la zona lumbar.",
      "Rodillas en la dirección de los dedos de los pies, sin juntarlas.",
      "Empuja con todo el pie y no bloquees las rodillas arriba.",
    ],
    siNoLoNotas: "Pies más abajo = más cuádriceps; pies más arriba = más glúteo e isquios.",
  },
  hack_squat: {
    prepara: ["Hombros bajo las almohadillas y espalda pegada al respaldo.", "Pies a la anchura de las caderas, un poco adelantados."],
    claves: ["Baja controlando hasta 90° o algo más si es cómodo.", "Sube empujando con todo el pie, sin bloquear las rodillas."],
  },
  sentadilla_cinturon: {
    prepara: ["Cinturón bien ajustado a la cadera y pies a la anchura de los hombros.", "Con la derecha puedes sujetarte a la barandilla para equilibrarte."],
    claves: ["Baja con el pecho alto, como sentándote entre los talones.", "Sube empujando el suelo; la espalda no carga nada."],
  },
  extension_cuadriceps: {
    prepara: ["Rodilla alineada con el eje de la máquina y el rodillo sobre el tobillo.", "Espalda apoyada; con la derecha puedes sujetar el agarre lateral."],
    claves: ["Sube hasta estirar la pierna y aprieta 1 s.", "Baja despacio, sin dejar caer el peso."],
  },
  curl_femoral_tumbado: {
    prepara: ["Rodillas justo por debajo del borde del banco y el rodillo encima de los talones.", "Cadera pegada al banco todo el rato."],
    claves: ["Lleva los talones hacia el glúteo sin levantar la cadera.", "Baja despacio, casi hasta estirar."],
    siNoLoNotas: "Si se levanta la cadera, quita peso: es la señal de que tira la espalda.",
  },
  curl_femoral_sentado: {
    prepara: ["Rodilla alineada con el eje y el rodillo de arriba bien apretado sobre los muslos.", "Respaldo ajustado para que la espalda quede pegada."],
    claves: ["Lleva los talones hacia abajo y atrás.", "Aguanta 1 s abajo y sube despacio."],
  },
  hip_thrust_maquina: {
    prepara: ["Espalda alta apoyada y la almohadilla sobre la cadera, no sobre el abdomen.", "Pies a una distancia en la que, arriba, las rodillas queden a 90°."],
    claves: ["Sube empujando con los talones hasta que el tronco quede recto.", "Aprieta el glúteo 1 s arriba, sin arquear la zona lumbar.", "Barbilla hacia el pecho."],
  },
  hiperextension: {
    prepara: ["Ajusta el cojín para que el borde quede justo por debajo de la cadera.", "Brazos cruzados sobre el pecho: no hace falta agarrarse."],
    claves: ["Baja con la espalda recta, doblando por la cadera.", "Sube hasta que el cuerpo quede en línea recta, sin pasarte hacia atrás."],
  },
  aductor_maquina: {
    prepara: ["Abre la máquina solo hasta donde notes un estiramiento cómodo.", "Espalda apoyada."],
    claves: ["Cierra las piernas apretando 1 s.", "Abre despacio, sin dejar que el peso te abra de golpe."],
  },
  abductor_maquina: {
    prepara: ["Espalda apoyada y almohadillas por fuera de las rodillas."],
    claves: ["Abre las piernas y aguanta 1 s.", "Cierra despacio, sin que choquen las placas."],
    siNoLoNotas: "Inclínate un poco hacia delante para notarlo más en el glúteo.",
  },
  gemelo_maquina_pie: {
    prepara: ["Hombros bajo las almohadillas y la punta de los pies en el borde del escalón."],
    claves: ["Baja el talón todo lo que puedas y aguanta 1 s abajo.", "Sube de puntillas del todo y aprieta 1 s.", "Rodillas casi estiradas y quietas."],
  },
  gemelo_prensa: {
    prepara: ["Solo la punta de los pies en el borde inferior de la plataforma.", "Piernas casi estiradas, sin bloquear del todo."],
    claves: ["Empuja con la punta de los pies, como poniéndote de puntillas.", "Recorrido completo y lento: los gemelos responden a repeticiones controladas."],
  },
};

export interface SeccionConsejos {
  titulo: string;
  lineas: string[];
}

/** Indicación de peso a partir del rango de repeticiones y el RIR que tocan. */
export function consejoPeso(p: { repsMin: number; repsMax: number; rir: number }, medida: Measure): string {
  if (medida === "segundos") return `Aguanta entre ${p.repsMin} y ${p.repsMax} s con buena postura; cuando llegues a ${p.repsMax} s, ponlo más difícil.`;
  return `Elige un peso con el que hagas ${p.repsMin}-${p.repsMax} repeticiones y te queden unas ${p.rir} en recámara. Si haces más de ${p.repsMax} con buena técnica, la siguiente vez sube.`;
}

/** Consejos para la pantalla de sesión. Si el ejercicio no tiene consejos propios, se sacan de su técnica. */
export function consejosDe(
  e: Exercise,
  p: { repsMin: number; repsMax: number; rir: number },
  manoLimitada = true,
): SeccionConsejos[] {
  const c = CONSEJOS[e.id];
  const sinManoIzq = (l: string) => manoLimitada || !/mano izquierda/i.test(l);
  const prepara = (c?.prepara ?? e.pasos.slice(0, 1)).filter(sinManoIzq);
  const claves = c?.claves ?? e.pasos.slice(1);
  const secciones: SeccionConsejos[] = [
    { titulo: "Antes de empezar", lineas: prepara },
    { titulo: "En cada repetición", lineas: claves },
    { titulo: "Evita", lineas: e.errores },
    { titulo: "El peso", lineas: [consejoPeso(p, e.medida)] },
  ];
  if (c?.siNoLoNotas) secciones.push({ titulo: "Si no lo notas", lineas: [c.siNoLoNotas] });
  return secciones.filter((s) => s.lineas.length > 0);
}
