"use client";

import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ilustracion } from "@/components/exercise/illustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Aviso, Cargando, Glass } from "@/components/ui-kit";
import { useAjustes, useArmExercises } from "@/lib/db/hooks";
import { guardar, nuevoId } from "@/lib/db/repo";
import type { ArmEntry, ArmExercise, ArmSession } from "@/lib/db/types";
import { hoyISO } from "@/lib/domain/dates";
import { avisoDolor } from "@/lib/domain/left-arm";
import { cn } from "@/lib/utils";

function Dolor({ valor, onChange, etiqueta }: { valor: number; onChange: (v: number) => void; etiqueta: string }) {
  const aviso = avisoDolor(valor);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{etiqueta}</span>
        <span className={cn("font-display text-2xl tabular-nums", aviso.nivel === "ok" ? "text-lime" : aviso.nivel === "precaucion" ? "text-warn" : "text-destructive")}>
          {valor}/10
        </span>
      </div>
      <Slider min={0} max={10} step={1} value={[valor]} onValueChange={([v]) => onChange(v)} aria-label={etiqueta} />
      {aviso.nivel !== "ok" && <Aviso tipo={aviso.nivel === "parar" ? "danger" : "warn"}>{aviso.mensaje}</Aviso>}
    </div>
  );
}

export default function SesionBrazo() {
  const ajustes = useAjustes();
  const ejercicios = useArmExercises();
  if (!ajustes || !ejercicios) return <Cargando />;
  if (!ajustes.moduloBrazo) return <Aviso>El módulo de brazo izquierdo está desactivado.</Aviso>;
  return <FormularioSesion ejercicios={ejercicios} />;
}

function nuevaSesion(ejercicios: ArmExercise[]): ArmSession {
  const entradas: ArmEntry[] = ejercicios
      .filter((e) => e.activo)
      .map((e) => ({
        armExerciseId: e.id,
        nombre: e.nombre,
        medida: e.medida,
        series: Array.from({ length: e.series }, () => ({ valor: e.objetivo, carga: e.carga, hecho: false })),
      }));
  return { id: nuevoId(), fecha: hoyISO(), entradas, dolorAntes: 0, dolorDespues: null, completado: false, notas: "", updatedAt: 0, _dirty: 1 };
}

function FormularioSesion({ ejercicios }: { ejercicios: ArmExercise[] }) {
  const router = useRouter();
  const [s, setS] = useState<ArmSession>(() => nuevaSesion(ejercicios));

  // Guardado instantáneo de cada cambio.
  useEffect(() => {
    if (s.updatedAt === 0) return;
    const t = setTimeout(() => void guardar<ArmSession>("armSessions", s), 400);
    return () => clearTimeout(t);
  }, [s]);


  const cambiar = (fn: (x: ArmSession) => void) =>
    setS((x) => {
      const c = structuredClone(x);
      fn(c);
      c.updatedAt = Date.now();
      return c;
    });

  const dolorMax = Math.max(s.dolorAntes, s.dolorDespues ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-lg" className="rounded-2xl" aria-label="Volver">
          <Link href="/brazo/">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-heading text-2xl tracking-wide">Sesión · brazo izquierdo</h1>
      </div>

      <Glass>
        <Dolor etiqueta="Dolor antes de empezar" valor={s.dolorAntes} onChange={(v) => cambiar((x) => void (x.dolorAntes = v))} />
      </Glass>

      {s.entradas.map((en, i) => {
        const ej = ejercicios.find((e) => e.id === en.armExerciseId);
        return (
          <Glass key={en.armExerciseId} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary/60">
                <Ilustracion clave={ej?.ilustracion} className="size-12" />
              </div>
              <div>
                <p className="font-medium">{en.nombre}</p>
                {ej?.descripcion && <p className="text-xs text-muted-foreground">{ej.descripcion}</p>}
              </div>
            </div>
            <ol className="space-y-2">
              {en.series.map((se, k) => (
                <li key={k} className="grid grid-cols-[3.5rem_1fr_1fr_3rem] items-center gap-2">
                  <span className="text-xs text-muted-foreground">Serie {k + 1}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    aria-label={en.medida === "reps" ? "Repeticiones" : "Segundos"}
                    value={se.valor ?? ""}
                    onChange={(e) => cambiar((x) => void (x.entradas[i].series[k].valor = e.target.value === "" ? null : Number(e.target.value)))}
                    className="h-11 rounded-xl text-center"
                  />
                  <Input
                    aria-label="Carga"
                    value={se.carga}
                    onChange={(e) => cambiar((x) => void (x.entradas[i].series[k].carga = e.target.value))}
                    className="h-11 rounded-xl text-center text-xs"
                  />
                  <button
                    type="button"
                    aria-label={se.hecho ? "Marcar como no hecha" : "Marcar como hecha"}
                    aria-pressed={se.hecho}
                    onClick={() => cambiar((x) => void (x.entradas[i].series[k].hecho = !se.hecho))}
                    className={cn("grid size-11 place-items-center rounded-xl", se.hecho ? "bg-lime/20 text-lime" : "bg-secondary")}
                  >
                    <Check className="size-5" />
                  </button>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-muted-foreground">
              {en.medida === "reps" ? "Repeticiones" : "Segundos"} y carga por serie. Progresión muy conservadora: pequeños pasos.
            </p>
          </Glass>
        );
      })}

      <Glass className="space-y-4">
        <Dolor
          etiqueta="Dolor al terminar"
          valor={s.dolorDespues ?? 0}
          onChange={(v) => cambiar((x) => void (x.dolorDespues = v))}
        />
        <Textarea
          placeholder="Notas: sensaciones, qué cambiar…"
          value={s.notas}
          onChange={(e) => cambiar((x) => void (x.notas = e.target.value))}
          className="min-h-20 rounded-2xl"
        />
      </Glass>

      {dolorMax > 3 && (
        <Aviso tipo="warn">Has marcado dolor por encima de 3: la próxima vez baja carga o repeticiones.</Aviso>
      )}

      <Button
        className="h-14 w-full rounded-2xl text-base font-semibold"
        onClick={async () => {
          await guardar<ArmSession>("armSessions", { ...s, completado: true, dolorDespues: s.dolorDespues ?? s.dolorAntes });
          toast.success("Sesión guardada");
          router.push("/brazo/");
        }}
      >
        <Save /> Terminar y guardar
      </Button>
    </div>
  );
}
