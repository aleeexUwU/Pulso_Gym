"use client";

import { CheckCircle2, Clock, Flame, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Calendario } from "@/components/calendar";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { ReminderCard } from "@/components/reminder-card";
import { Button } from "@/components/ui/button";
import { Cargando, Glass, PageHeader, SectionTitle, Stat } from "@/components/ui-kit";
import { filtroCasa } from "@/lib/app/planificacion";
import { clavesHechas, fechasDe } from "@/lib/app/resumen";
import { useAbsSessions, useAjustes, useEvaluacionBrazo, usePerfil } from "@/lib/db/hooks";
import { CATEGORIA_NOMBRE, rutinaAbdominales } from "@/lib/domain/abs-routine";
import { hoyISO } from "@/lib/domain/dates";
import { tieneManoLimitada } from "@/lib/domain/limitations";
import { ejercicio } from "@/lib/domain/exercises";
import { mejorRacha, racha } from "@/lib/domain/weekly-plan";

export default function Abdominales() {
  const perfil = usePerfil();
  const ajustes = useAjustes();
  const ev = useEvaluacionBrazo();
  const sesiones = useAbsSessions();
  if (!perfil || !ajustes || !sesiones || ev === undefined) return <Cargando />;

  const hoy = hoyISO();
  const rutina = rutinaAbdominales(hoy, ajustes.inicioAbdominales, filtroCasa(perfil, ajustes, ev));
  const claves = clavesHechas([], sesiones, []);
  const fechas = fechasDe(claves, "abdominales");
  const hechoHoy = claves.has(`${hoy}|abdominales`);
  const actual = racha(fechas, hoy);

  return (
    <div className="space-y-5">
      <PageHeader titulo="Core en casa" subtitulo="10–15 min al día · sin material" />

      <div className="grid grid-cols-3 gap-2">
        <Stat etiqueta="Racha" valor={<span className="flex items-center gap-1"><Flame className="size-5 text-warn" />{actual}</span>} detalle="días" color="warn" />
        <Stat etiqueta="Mejor" valor={mejorRacha(fechas)} detalle="días" color="violet" />
        <Stat etiqueta="Total" valor={fechas.length} detalle="sesiones" color="lime" />
      </div>

      <Glass className={hechoHoy ? "" : "neon-border"}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Hoy · semana {rutina.semana + 1}
            </p>
            <p className="font-heading text-2xl tracking-wide">
              {hechoHoy ? (
                <span className="flex items-center gap-1.5 text-lime">
                  <CheckCircle2 className="size-5" /> ¡Hecho hoy!
                </span>
              ) : (
                "Rutina del día"
              )}
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" /> ~{rutina.duracionEstimadaMin} min
          </span>
        </div>
        <ol className="space-y-2">
          {rutina.items.map((it) => {
            const e = ejercicio(it.exerciseId);
            return (
              <li key={it.exerciseId} className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-2">
                <ExerciseImage ejercicio={e} animar={false} className="size-14 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{e.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIA_NOMBRE[it.categoria]} · {it.series} × {it.objetivo}
                    {it.medida === "segundos" ? " s" : " reps"}
                    {it.nivel > 0 && ` · nivel ${it.nivel + 1}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <Button asChild className="mt-4 h-14 w-full rounded-2xl text-base font-semibold" variant={hechoHoy ? "secondary" : "default"}>
          <Link href="/abdominales/sesion/">{hechoHoy ? <><RotateCcw /> Repetir</> : <><Play /> Empezar</>}</Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Cada semana suben las repeticiones o los segundos; al llegar al tope pasas a una variante más difícil.
          {tieneManoLimitada(perfil.limitaciones) && " Sin apoyar peso en la mano izquierda."}
        </p>
      </Glass>

      <Glass>
        <SectionTitle>Calendario</SectionTitle>
        <Calendario hechas={claves} tipos={["abdominales"]} />
      </Glass>

      <Glass>
        <ReminderCard ajustes={ajustes} />
      </Glass>
    </div>
  );
}
