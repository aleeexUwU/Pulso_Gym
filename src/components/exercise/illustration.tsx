"use client";

/**
 * Ilustraciones SVG animadas propias para ejercicios sin foto (sobre todo los
 * adaptados del brazo izquierdo). Figura esquemática con el brazo que trabaja
 * resaltado en neón.
 */

type Familia = "lateral" | "frontal" | "codo" | "rotacion" | "pulso" | "sentadilla" | "suelo" | "empuje";

const FAMILIA: Record<string, Familia> = {
  elevacion_lateral: "lateral",
  apertura_posterior: "lateral",
  retraccion: "lateral",
  elevacion_frontal: "frontal",
  press: "empuje",
  remo: "empuje",
  curl: "codo",
  flexion_codo: "codo",
  extension_codo: "codo",
  rotacion: "rotacion",
  isometrico: "pulso",
  movilidad_muneca: "pulso",
  agarre: "pulso",
  sentadilla: "sentadilla",
  aduccion: "suelo",
  hollow: "suelo",
  nadador: "suelo",
};

const DUR = "2.4s";

function Anim({ desde, hasta, cx, cy }: { desde: number; hasta: number; cx: number; cy: number }) {
  return (
    <animateTransform
      attributeName="transform"
      type="rotate"
      values={`${desde} ${cx} ${cy}; ${hasta} ${cx} ${cy}; ${desde} ${cx} ${cy}`}
      dur={DUR}
      repeatCount="indefinite"
      calcMode="spline"
      keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
    />
  );
}

export function Ilustracion({ clave, className }: { clave?: string; className?: string }) {
  const fam = (clave && FAMILIA[clave]) || "lateral";
  const base = "stroke-foreground/60";
  const activo = "stroke-[var(--neon)]";
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Ilustración del movimiento">
      <defs>
        <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {fam === "suelo" ? (
          <>
            <line x1="20" y1="150" x2="180" y2="150" className="stroke-foreground/15" strokeWidth="3" />
            <circle cx="40" cy="128" r="12" className={base} />
            <line x1="54" y1="132" x2="120" y2="134" className={base} />
            <line x1="56" y1="134" x2="96" y2="146" className={base} />
            <g filter="url(#brillo)">
              <line x1="120" y1="134" x2="178" y2="136" className={activo}>
                <Anim desde={0} hasta={-22} cx={120} cy={134} />
              </line>
            </g>
            <line x1="120" y1="136" x2="176" y2="146" className={base} />
          </>
        ) : fam === "sentadilla" ? (
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 26; 0 0" dur={DUR} repeatCount="indefinite" />
            <circle cx="100" cy="40" r="13" className={base} />
            <line x1="100" y1="55" x2="100" y2="110" className={base} />
            <line x1="100" y1="70" x2="140" y2="78" className={base} />
            <g filter="url(#brillo)">
              <polyline points="100,110 78,140 92,172" className={activo} />
              <polyline points="100,110 122,140 108,172" className={activo} />
            </g>
          </g>
        ) : (
          <>
            <circle cx="100" cy="38" r="13" className={base} />
            <line x1="100" y1="53" x2="100" y2="118" className={base} />
            <polyline points="100,118 84,176" className={base} />
            <polyline points="100,118 116,176" className={base} />
            {/* brazo que no trabaja */}
            <polyline points="100,64 74,96 70,124" className={base} />
            {/* brazo que trabaja, animado */}
            <g filter="url(#brillo)">
              {fam === "lateral" && (
                <polyline points="100,64 130,96 134,124" className={activo}>
                  <Anim desde={0} hasta={-62} cx={100} cy={64} />
                </polyline>
              )}
              {fam === "frontal" && (
                <polyline points="100,64 104,104 106,132" className={activo}>
                  <Anim desde={0} hasta={-95} cx={100} cy={64} />
                </polyline>
              )}
              {fam === "empuje" && (
                <polyline points="100,64 128,72 156,70" className={activo}>
                  <animate attributeName="points" values="100,64 120,86 146,74; 100,64 136,66 172,66; 100,64 120,86 146,74" dur={DUR} repeatCount="indefinite" />
                </polyline>
              )}
              {fam === "codo" && (
                <>
                  <line x1="100" y1="64" x2="118" y2="100" className={activo} />
                  <line x1="118" y1="100" x2="122" y2="136" className={activo}>
                    <Anim desde={0} hasta={-130} cx={118} cy={100} />
                  </line>
                </>
              )}
              {fam === "rotacion" && (
                <>
                  <line x1="100" y1="64" x2="112" y2="100" className={activo} />
                  <line x1="112" y1="100" x2="146" y2="100" className={activo}>
                    <Anim desde={-10} hasta={45} cx={112} cy={100} />
                  </line>
                </>
              )}
              {fam === "pulso" && (
                <>
                  <polyline points="100,64 126,94 132,122" className={activo} />
                  <circle cx="133" cy="128" r="8" className={activo}>
                    <animate attributeName="r" values="7;11;7" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
