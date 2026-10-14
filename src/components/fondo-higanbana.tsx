"use client";

import { useMemo } from "react";
import { segmentos, type P, type Segmento } from "@/components/ciempies";
import { cn } from "@/lib/utils";

/**
 * Fondo ilustrado (dibujo propio, generado por código): un ciempiés a tinta en blanco
 * y negro enroscado junto a una flor de higanbana (lirio araña) en trazo carmesí.
 * Estilo de grabado: placas con bandas y sombreado, patas articuladas con garras e
 * hilos finos entre ellas. Es estático: va detrás de todo y no gasta batería.
 */

const ANCHO = 600;
const ALTO = 1000;

// ── Utilidades de geometría ──

function bezier(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Cinta con grosor variable a lo largo de una curva (pétalos, tallo, antenas, garras). */
function cinta(curvaEn: (t: number) => P, ancho: (t: number) => number, n = 28): string {
  const pts: P[] = Array.from({ length: n + 1 }, (_, i) => curvaEn(i / n));
  const izq: P[] = [];
  const der: P[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = ancho(i / n) / 2;
    izq.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    der.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  const f = (q: P) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  return `M${izq.map(f).join("L")}L${der.reverse().map(f).join("L")}Z`;
}

/** Pasa un punto del marco local (x hacia delante, y al lado) al global. */
function local(origen: P, angulo: number, x: number, y: number): P {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [origen[0] + x * c - y * s, origen[1] + x * s + y * c];
}

// ── Higanbana ──

const FLOR: P = [205, 215];

function Higanbana() {
  const d = useMemo(() => {
    const petalos: string[] = [];
    const nervios: string[] = [];
    // Pétalos estrechos que se abren y se enroscan hacia atrás.
    [-168, -128, -92, -55, -18, 22, 150].forEach((g, i) => {
      const a = (g * Math.PI) / 180;
      const s = i % 2 === 0 ? 1 : -1;
      const largo = 92 + (i % 3) * 14;
      const p0 = FLOR;
      const p1 = local(FLOR, a, largo * 0.45, -8 * s);
      const p2 = local(FLOR, a, largo * 1.25, -10 * s);
      const p3 = local(FLOR, a, largo * 0.72, 40 * s);
      petalos.push(cinta((t) => bezier(p0, p1, p2, p3, t), (t) => 2 + Math.sin(Math.PI * Math.min(1, t * 1.15)) * 11));
      nervios.push(`M${p0.join(" ")}C${p1.join(" ")} ${p2.join(" ")} ${p3.join(" ")}`);
    });
    // Estambres: largos, finos y curvados hacia arriba, con la antera al final.
    const estambres: { d: string; punta: P }[] = [-150, -118, -96, -74, -48, -25, 0, 18].map((g, i) => {
      const a = (g * Math.PI) / 180;
      const largo = 150 + ((i * 37) % 50);
      const s = g < -90 ? -1 : 1;
      const p1 = local(FLOR, a, largo * 0.4, 4 * s);
      const p2 = local(FLOR, a, largo * 0.8, -26 * s);
      const p3 = local(FLOR, a, largo, -12 * s);
      return { d: `M${FLOR.join(" ")}C${p1.join(" ")} ${p2.join(" ")} ${p3.join(" ")}`, punta: p3 };
    });
    // Tallo con dos líneas y unas brácteas bajo la flor.
    const tallo = cinta((t) => bezier([FLOR[0] + 6, FLOR[1] + 20], [235, 420], [262, 700], [300, ALTO + 20], t), (t) => 7 + t * 4, 40);
    const bracteas = [-1, 1].map((l) =>
      cinta((t) => bezier([FLOR[0] + 8, FLOR[1] + 40], [FLOR[0] + 8 + l * 16, FLOR[1] + 28], [FLOR[0] + 8 + l * 30, FLOR[1] + 6], [FLOR[0] + 8 + l * 34, FLOR[1] - 8], t), (t) => 6 * (1 - t) + 0.5),
    );
    return { petalos, nervios, estambres, tallo, bracteas };
  }, []);

  return (
    <g className="higanbana" strokeLinecap="round" strokeLinejoin="round">
      <path d={d.tallo} fill="var(--higanbana-relleno)" stroke="var(--higanbana)" strokeWidth={1.6} />
      {d.bracteas.map((b, i) => (
        <path key={i} d={b} fill="var(--higanbana-relleno)" stroke="var(--higanbana)" strokeWidth={1.2} />
      ))}
      <g fill="none" stroke="var(--higanbana)">
        {d.estambres.map((e, i) => (
          <path key={i} d={e.d} strokeWidth={1.3} />
        ))}
      </g>
      {d.estambres.map((e, i) => (
        <ellipse key={i} cx={e.punta[0]} cy={e.punta[1]} rx={4.5} ry={2.2} fill="var(--higanbana)" transform={`rotate(${i * 23} ${e.punta[0]} ${e.punta[1]})`} />
      ))}
      {d.petalos.map((p, i) => (
        <path key={i} d={p} fill="var(--higanbana-relleno)" stroke="var(--higanbana)" strokeWidth={1.7} />
      ))}
      <g fill="none" stroke="var(--higanbana)" strokeWidth={0.7} opacity={0.7}>
        {d.nervios.map((n, i) => (
          <path key={i} d={n} />
        ))}
      </g>
    </g>
  );
}

// ── Ciempiés a tinta ──

const RECORRIDO: P[] = [
  [450, 150],
  [418, 255],
  [345, 330],
  [300, 430],
  [330, 540],
  [265, 650],
  [185, 740],
  [160, 860],
  [215, 965],
];

function Pata({ s, lado, i }: { s: Segmento; lado: 1 | -1; i: number }) {
  const a = (s.a * Math.PI) / 180;
  const w = s.w;
  const abre = 1 + Math.sin(i * 1.7) * 0.12;
  const base = local([s.x, s.y], a, -2, lado * w * 0.42);
  const rodilla = local([s.x, s.y], a, -w * 0.3, lado * w * 1.05 * abre);
  const tobillo = local([s.x, s.y], a, -w * 0.95, lado * w * 1.42 * abre);
  const punta = local([s.x, s.y], a, -w * 1.5, lado * w * 1.38 * abre);
  const control = local([s.x, s.y], a, -w * 1.3, lado * w * 1.55 * abre);
  const garra = cinta((t) => bezier(tobillo, control, control, punta, t), (t) => 4.5 * (1 - t) + 0.3, 12);
  const linea = `M${base.join(" ")}L${rodilla.join(" ")}L${tobillo.join(" ")}`;
  return (
    <g>
      <path d={linea} stroke="var(--ciempies-tinta)" strokeWidth={7} fill="none" />
      <path d={linea} stroke="var(--ciempies-hueso)" strokeWidth={3.6} fill="none" />
      <circle cx={rodilla[0]} cy={rodilla[1]} r={2.6} fill="var(--ciempies-tinta)" />
      <path d={garra} fill="var(--ciempies-tinta)" stroke="var(--ciempies-hueso)" strokeWidth={0.9} />
    </g>
  );
}

function puntaPata(s: Segmento, lado: 1 | -1, i: number): P {
  const abre = 1 + Math.sin(i * 1.7) * 0.12;
  return local([s.x, s.y], (s.a * Math.PI) / 180, -s.w * 1.5, lado * s.w * 1.38 * abre);
}

function CiempiesTinta() {
  const segs = useMemo(() => segmentos(RECORRIDO, 24, 44), []);
  const cuerpo = segs.slice(1, -1);
  const cabeza = segs[0];
  const cola = segs[segs.length - 1];
  const ac = (cabeza.a * Math.PI) / 180;
  const at = (cola.a * Math.PI) / 180;
  const W = cabeza.w;

  return (
    <g className="ciempies-tinta" strokeLinecap="round" strokeLinejoin="round">
      {/* Hilos finos entre las puntas de las patas, como telaraña. */}
      <g fill="none" stroke="var(--ciempies-hueso)" strokeWidth={0.6} opacity={0.45}>
        {([-1, 1] as const).flatMap((lado) =>
          cuerpo.slice(0, -1).map((s, i) => {
            const p = puntaPata(s, lado, i);
            const q = puntaPata(cuerpo[i + 1], lado, i + 1);
            const m: P = [(p[0] + q[0]) / 2 + (s.x - p[0]) * 0.25, (p[1] + q[1]) / 2 + (s.y - p[1]) * 0.25];
            return <path key={`${lado}${i}`} d={`M${p.join(" ")}Q${m.join(" ")} ${q.join(" ")}`} />;
          }),
        )}
      </g>

      {/* Patas: detrás del cuerpo. */}
      {cuerpo.map((s, i) => (
        <g key={i}>
          <Pata s={s} lado={1} i={i} />
          <Pata s={s} lado={-1} i={i + 3} />
        </g>
      ))}

      {/* Cola: dos apéndices largos. */}
      {[-1, 1].map((l) => (
        <path
          key={l}
          d={cinta(
            (t) => bezier(local([cola.x, cola.y], at, 0, 0), local([cola.x, cola.y], at, -60, l * 18), local([cola.x, cola.y], at, -95, l * 40), local([cola.x, cola.y], at, -120, l * 70), t),
            (t) => 7 * (1 - t) + 0.4,
          )}
          fill="var(--ciempies-tinta)"
          stroke="var(--ciempies-hueso)"
          strokeWidth={1}
        />
      ))}

      {/* Placas del cuerpo, de la cola a la cabeza. */}
      {[...cuerpo, cola].reverse().map((s, k) => {
        const L = s.l;
        const Wp = s.w;
        return (
          <g key={k} transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.a.toFixed(1)})`}>
            <rect x={-L / 2} y={-Wp / 2} width={L} height={Wp} rx={Math.min(L, Wp) * 0.32} fill="var(--ciempies-hueso)" stroke="var(--ciempies-tinta)" strokeWidth={2} />
            {/* Bandas delantera y trasera, curvadas como un anillo. */}
            <path d={`M${L / 2 - 6} ${-Wp / 2 + 3}Q${L / 2 + 1} 0 ${L / 2 - 6} ${Wp / 2 - 3}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={1.4} />
            <path d={`M${-L / 2 + 5} ${-Wp / 2 + 4}Q${-L / 2 + 11} 0 ${-L / 2 + 5} ${Wp / 2 - 4}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={1} opacity={0.7} />
            {/* Sombra a plumilla en un costado. */}
            {[-0.28, -0.08, 0.12, 0.3].map((f) => (
              <path key={f} d={`M${f * L} ${Wp / 2 - 2}l${2.5} ${-Wp * 0.22}`} stroke="var(--ciempies-tinta)" strokeWidth={1.1} opacity={0.75} />
            ))}
            <path d={`M${-L / 2 + 3} ${Wp / 2 - 4}Q0 ${Wp / 2 - 1} ${L / 2 - 4} ${Wp / 2 - 5}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={2.2} opacity={0.55} />
            {/* Marca central en rombo, una placa sí y otra no. */}
            {k % 2 === 0 && <path d={`M-4 -3l4 -4 4 4 -4 4z`} fill="var(--ciempies-tinta)" opacity={0.55} />}
          </g>
        );
      })}

      {/* Cabeza: antenas largas, pinzas y cúpula con collar. */}
      {[-1, 1].map((l) => (
        <g key={l}>
          <path
            d={cinta(
              (t) => bezier(local([cabeza.x, cabeza.y], ac, W * 0.35, l * W * 0.22), local([cabeza.x, cabeza.y], ac, W * 1.4, l * W * 0.35), local([cabeza.x, cabeza.y], ac, W * 2.3, l * W * 1.1), local([cabeza.x, cabeza.y], ac, W * 3.1, l * W * 2.1), t),
              (t) => 5 * (1 - t) + 0.4,
            )}
            fill="var(--ciempies-tinta)"
            stroke="var(--ciempies-hueso)"
            strokeWidth={1}
          />
          <path
            d={cinta(
              (t) => bezier(local([cabeza.x, cabeza.y], ac, W * 0.25, l * W * 0.38), local([cabeza.x, cabeza.y], ac, W * 0.75, l * W * 0.55), local([cabeza.x, cabeza.y], ac, W * 0.95, l * W * 0.2), local([cabeza.x, cabeza.y], ac, W * 0.8, l * W * 0.02), t),
              (t) => 6 * (1 - t) + 0.6,
              14,
            )}
            fill="var(--ciempies-tinta)"
            stroke="var(--ciempies-hueso)"
            strokeWidth={1}
          />
        </g>
      ))}
      <g transform={`translate(${cabeza.x.toFixed(1)} ${cabeza.y.toFixed(1)}) rotate(${cabeza.a.toFixed(1)})`}>
        <rect x={-W * 0.32} y={-W * 0.5} width={W * 0.3} height={W} rx={W * 0.12} fill="var(--ciempies-hueso)" stroke="var(--ciempies-tinta)" strokeWidth={2} />
        <ellipse cx={W * 0.18} rx={W * 0.5} ry={W * 0.47} fill="var(--ciempies-hueso)" stroke="var(--ciempies-tinta)" strokeWidth={2.2} />
        <path d={`M${-W * 0.12} ${W * 0.3}Q${W * 0.25} ${W * 0.52} ${W * 0.55} ${W * 0.22}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={2.4} opacity={0.6} />
        <path d={`M${W * 0.02} ${-W * 0.22}Q${W * 0.22} ${-W * 0.34} ${W * 0.4} ${-W * 0.2}`} fill="none" stroke="var(--ciempies-tinta)" strokeWidth={1.2} opacity={0.6} />
      </g>
    </g>
  );
}

export function FondoHiganbana({ className }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="xMidYMid meet" className={cn("overflow-visible", className)} aria-hidden focusable="false">
      <Higanbana />
      <CiempiesTinta />
    </svg>
  );
}
