"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Ciempiés dibujado por código (ilustración propia, sin recursos de ninguna obra):
 * placas de hueso con borde de tinta negra, patas articuladas que ondulan en ola,
 * antenas y pinzas. Blanco y negro. Se dibuja a lo largo de una curva suave que
 * pasa por `puntos` (de la cabeza a la cola) en un viewBox `ancho × alto`.
 */

export type P = [number, number];

/** Curva Catmull-Rom que pasa por todos los puntos. */
export function curva(puntos: P[], u: number): P {
  const n = puntos.length - 1;
  const x = Math.min(n - 1e-6, Math.max(0, u * n));
  const i = Math.floor(x);
  const t = x - i;
  const p0 = puntos[Math.max(0, i - 1)];
  const p1 = puntos[i];
  const p2 = puntos[i + 1];
  const p3 = puntos[Math.min(n, i + 2)];
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

export interface Segmento {
  x: number;
  y: number;
  /** Ángulo de la tangente (grados), apuntando hacia la cabeza. */
  a: number;
  /** Ancho del cuerpo en este segmento. */
  w: number;
  /** Largo de la placa (algo más que la separación, para que se solapen). */
  l: number;
}

export function segmentos(puntos: P[], n: number, grosor: number): Segmento[] {
  // Tabla de longitud de arco para repartir los segmentos a la misma distancia.
  const M = 600;
  const tabla: { u: number; s: number; p: P }[] = [];
  let s = 0;
  let prev = curva(puntos, 0);
  for (let k = 0; k <= M; k++) {
    const u = k / M;
    const p = curva(puntos, u);
    s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    tabla.push({ u, s, p });
    prev = p;
  }
  const total = s;
  const enS = (obj: number): P => {
    const k = tabla.findIndex((e) => e.s >= obj);
    return (k <= 0 ? tabla[0] : tabla[k]).p;
  };
  const out: Segmento[] = [];
  const paso = (total * 0.97) / (n - 1);
  for (let i = 0; i < n; i++) {
    const sObj = (i / (n - 1)) * total * 0.97 + total * 0.015;
    const [x, y] = enS(sObj);
    const [xa, ya] = enS(Math.max(0, sObj - 2));
    const [xb, yb] = enS(Math.min(total, sObj + 2));
    const a = (Math.atan2(ya - yb, xa - xb) * 180) / Math.PI;
    // Cabeza algo más ancha, cuerpo uniforme y cola que se afina.
    const r = i / (n - 1);
    const w = grosor * (r < 0.08 ? 0.92 : r > 0.7 ? 1 - (r - 0.7) * 1.6 : 1);
    out.push({ x, y, a, w, l: paso * 1.18 });
  }
  return out;
}

export const RECORRIDOS = {
  /** Diagonal en S, para la portada. */
  portada: { ancho: 360, alto: 560, puntos: [[300, 40], [220, 120], [290, 240], [150, 330], [210, 450], [90, 530]] as P[] },
  /** Vertical ondulado, para el borde de la barra lateral. */
  lateral: { ancho: 120, alto: 900, puntos: [[60, 30], [85, 180], [35, 330], [80, 480], [40, 630], [75, 780], [55, 880]] as P[] },
  /** Horizontal ondulado, para acompañar un título. */
  horizontal: { ancho: 420, alto: 110, puntos: [[400, 52], [330, 30], [255, 70], [180, 38], [105, 66], [25, 48]] as P[] },
  /** Enroscado, para la pantalla de carga. */
  enroscado: {
    ancho: 200,
    alto: 200,
    puntos: [[100, 30], [160, 60], [170, 120], [120, 165], [60, 150], [45, 95], [85, 70], [125, 95], [115, 125]] as P[],
  },
} satisfies Record<string, { ancho: number; alto: number; puntos: P[] }>;

export function Ciempies({
  recorrido = "portada",
  segmentos: n = 26,
  grosor = 22,
  animado = true,
  className,
}: {
  recorrido?: keyof typeof RECORRIDOS;
  segmentos?: number;
  grosor?: number;
  animado?: boolean;
  className?: string;
}) {
  const { ancho, alto, puntos } = RECORRIDOS[recorrido];
  const segs = useMemo(() => segmentos(puntos, n, grosor), [puntos, n, grosor]);
  const cabeza = segs[0];
  const pata = grosor * 1.05;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={cn("ciempies", animado && "ciempies-vivo", className)}
      aria-hidden
      focusable="false"
    >
      {/* Patas: detrás del cuerpo, un par por segmento (menos en cabeza y cola). */}
      <g className="ciempies-patas" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {segs.slice(1, -2).map((s, i) =>
          ([-1, 1] as const).map((lado) => (
            <g
              key={`${i}${lado}`}
              transform={`translate(${s.x} ${s.y}) rotate(${s.a})`}
            >
              <g
                className="ciempies-pata"
                // El giro se hace desde donde la pata se une al cuerpo (esquina de su caja).
                style={{
                  animationDelay: `${-(i * 0.09 + (lado > 0 ? 0.55 : 0))}s`,
                  transformOrigin: lado > 0 ? "100% 0%" : "100% 100%",
                }}
              >
                {/* Tinta debajo para que la pata se lea sobre cualquier fondo. */}
                <path
                  d={`M0 ${(lado * s.w) / 2.4} l${-pata * 0.25} ${lado * pata * 0.55} l${-pata * 0.45} ${lado * pata * 0.35}`}
                  stroke="var(--ciempies-tinta)"
                  strokeWidth={4.2}
                />
                <path
                  d={`M0 ${(lado * s.w) / 2.4} l${-pata * 0.25} ${lado * pata * 0.55} l${-pata * 0.45} ${lado * pata * 0.35}`}
                  stroke="var(--ciempies-hueso)"
                  strokeWidth={1.8}
                />
              </g>
            </g>
          )),
        )}
      </g>

      {/* Cola: dos apéndices largos hacia atrás. */}
      {(() => {
        const c = segs[segs.length - 1];
        return (
          <g transform={`translate(${c.x} ${c.y}) rotate(${c.a})`} fill="none" strokeLinecap="round">
            {[-1, 1].map((l) => (
              <g key={l}>
                <path d={`M0 0 q${-grosor} ${l * grosor * 0.4} ${-grosor * 2} ${l * grosor * 0.9}`} stroke="var(--ciempies-tinta)" strokeWidth={4} />
                <path d={`M0 0 q${-grosor} ${l * grosor * 0.4} ${-grosor * 2} ${l * grosor * 0.9}`} stroke="var(--ciempies-hueso)" strokeWidth={1.6} />
              </g>
            ))}
          </g>
        );
      })()}

      {/* Cuerpo: de la cola a la cabeza para que cada placa monte sobre la siguiente. */}
      <g className="ciempies-cuerpo">
        {[...segs].reverse().map((s, k) => {
          const i = segs.length - 1 - k;
          const largo = s.l;
          return (
            <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.a})`}>
              <rect
                x={-largo / 2}
                y={-s.w / 2}
                width={largo}
                height={s.w}
                rx={largo * 0.42}
                fill="var(--ciempies-hueso)"
                stroke="var(--ciempies-tinta)"
                strokeWidth={2.4}
              />
              {/* Surco central y sombra de la placa: el toque de grabado en blanco y negro. */}
              <path d={`M${-largo / 2 + 2} 0 h${largo - 4}`} stroke="var(--ciempies-tinta)" strokeWidth={1.2} opacity={0.55} />
              <path
                d={`M${-largo / 2 + 1.5} ${-s.w / 2 + 3} v${s.w - 6}`}
                stroke="var(--ciempies-tinta)"
                strokeWidth={2}
                opacity={0.8}
              />
            </g>
          );
        })}
      </g>

      {/* Cabeza: placa redonda, pinzas curvas y antenas. */}
      <g transform={`translate(${cabeza.x} ${cabeza.y}) rotate(${cabeza.a})`}>
        <g fill="none" strokeLinecap="round">
          {[-1, 1].map((l) => (
            <g key={l}>
              <path
                className="ciempies-antena"
                d={`M${grosor * 0.35} ${l * grosor * 0.2} q${grosor * 1.2} ${l * grosor * 0.2} ${grosor * 2.1} ${l * grosor * 1.3}`}
                stroke="var(--ciempies-tinta)"
                strokeWidth={3.6}
              />
              <path
                className="ciempies-antena"
                d={`M${grosor * 0.35} ${l * grosor * 0.2} q${grosor * 1.2} ${l * grosor * 0.2} ${grosor * 2.1} ${l * grosor * 1.3}`}
                stroke="var(--ciempies-hueso)"
                strokeWidth={1.4}
                strokeDasharray="5 2.5"
              />
              <path
                d={`M${grosor * 0.2} ${l * grosor * 0.38} q${grosor * 0.75} ${l * grosor * 0.15} ${grosor * 0.62} ${-l * grosor * 0.18}`}
                stroke="var(--ciempies-tinta)"
                strokeWidth={5}
              />
              <path
                d={`M${grosor * 0.2} ${l * grosor * 0.38} q${grosor * 0.75} ${l * grosor * 0.15} ${grosor * 0.62} ${-l * grosor * 0.18}`}
                stroke="var(--ciempies-hueso)"
                strokeWidth={2.2}
              />
            </g>
          ))}
        </g>
        <ellipse rx={grosor * 0.52} ry={grosor * 0.5} fill="var(--ciempies-hueso)" stroke="var(--ciempies-tinta)" strokeWidth={2.4} />
        <path d={`M${-grosor * 0.15} ${-grosor * 0.25} q${grosor * 0.4} ${grosor * 0.25} 0 ${grosor * 0.5}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={1.6} />
      </g>
    </svg>
  );
}
