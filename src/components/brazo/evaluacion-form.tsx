"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Chips } from "@/components/ui-kit";
import { escribirKv } from "@/lib/db/repo";
import { hoyISO } from "@/lib/domain/dates";
import { evaluacionVacia, type ArmAssessment, type Respuesta3 } from "@/lib/domain/left-arm";

const PREGUNTAS: { clave: keyof ArmAssessment; texto: string; ayuda?: string }[] = [
  { clave: "agarra", texto: "¿Puedes agarrar objetos con la mano izquierda?", ayuda: "Una botella, una pelota blanda…" },
  { clave: "flexionaCodo", texto: "¿Doblas el codo izquierdo sin dolor?" },
  { clave: "extiendeCodo", texto: "¿Estiras el codo izquierdo por completo?" },
  { clave: "elevaPorEncimaHombro", texto: "¿Levantas el brazo por encima del hombro?" },
  { clave: "rotaHombro", texto: "¿Giras el antebrazo hacia fuera con el codo pegado al cuerpo?" },
  {
    clave: "apoyoAntebrazoComodo",
    texto: "¿Te resulta cómodo apoyar peso sobre el antebrazo izquierdo?",
    ayuda: "Por ejemplo en una plancha sobre antebrazos. Si dices que sí, el core en casa podrá incluirla.",
  },
];

const OPCIONES: { valor: Respuesta3; etiqueta: string }[] = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "parcial", etiqueta: "A medias" },
  { valor: "no", etiqueta: "No" },
];

/** Autoevaluación guiada del brazo izquierdo. Filtra los ejercicios compatibles. */
export function EvaluacionForm({ inicial, onGuardada }: { inicial?: ArmAssessment | null; onGuardada?: () => void }) {
  const [ev, setEv] = useState<ArmAssessment>(() => inicial ?? evaluacionVacia(hoyISO()));
  const set = <K extends keyof ArmAssessment>(k: K, v: ArmAssessment[K]) => setEv((x) => ({ ...x, [k]: v }));

  return (
    <div className="space-y-5">
      {PREGUNTAS.map((p) => (
        <div key={p.clave}>
          <p className="text-sm font-medium">{p.texto}</p>
          {p.ayuda && <p className="text-xs text-muted-foreground">{p.ayuda}</p>}
          <Chips<Respuesta3>
            className="mt-2"
            valor={ev[p.clave] as Respuesta3}
            onChange={(v) => set(p.clave, v as never)}
            opciones={OPCIONES}
          />
        </div>
      ))}
      {(
        [
          ["dolorReposo", "Dolor en reposo"],
          ["dolorMovimiento", "Dolor al moverlo"],
        ] as const
      ).map(([k, t]) => (
        <div key={k}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{t}</span>
            <span className="font-semibold tabular-nums text-primary">{ev[k]}/10</span>
          </div>
          <Slider className="mt-3" min={0} max={10} step={1} value={[ev[k]]} onValueChange={([v]) => set(k, v)} aria-label={t} />
        </div>
      ))}
      <div>
        <p className="text-sm font-medium">Notas (lo que te haya dicho tu fisio, sensaciones…)</p>
        <Textarea value={ev.notas} onChange={(e) => set("notas", e.target.value)} className="mt-2 min-h-20 rounded-2xl" />
      </div>
      <Button
        className="h-14 w-full rounded-2xl text-base font-semibold"
        onClick={async () => {
          await escribirKv("evaluacionBrazo", { ...ev, fecha: hoyISO() });
          toast.success("Autoevaluación guardada");
          onGuardada?.();
        }}
      >
        Guardar autoevaluación
      </Button>
    </div>
  );
}
