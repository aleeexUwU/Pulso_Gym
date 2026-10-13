"use client";

import { ClipboardCheck, Download, ExternalLink, Hand, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EjercicioForm, borradorVacio, type BorradorEjercicio } from "@/components/brazo/ejercicio-form";
import { EvaluacionForm } from "@/components/brazo/evaluacion-form";
import { VideoPropio } from "@/components/brazo/video-propio";
import { Ilustracion } from "@/components/exercise/illustration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Aviso, Cargando, Chips, Glass, PageHeader, SectionTitle } from "@/components/ui-kit";
import { guardarAjustes } from "@/lib/app/planificacion";
import { useAjustes, useArmExercises, useArmSessions, useEvaluacionBrazo } from "@/lib/db/hooks";
import { borrar, guardar, nuevoId } from "@/lib/db/repo";
import type { ArmExercise } from "@/lib/db/types";
import { formatoFecha, NOMBRE_DIA_CORTO, SEMANA_LUNES } from "@/lib/domain/dates";
import { ejerciciosCompatibles } from "@/lib/domain/left-arm";
import type { Weekday } from "@/lib/domain/types";

const AVISO =
  "Este módulo es orientativo. Lo ideal es validarlo con un fisioterapeuta o un terapeuta de mano, que puede pautarte ejercicios concretos: añádelos aquí. Nunca fuerces la muñeca ni trabajes con dolor.";

export default function Brazo() {
  const ajustes = useAjustes();
  const ev = useEvaluacionBrazo();
  const ejercicios = useArmExercises();
  const sesiones = useArmSessions();
  const [editar, setEditar] = useState<BorradorEjercicio | null>(null);
  const [repetirEv, setRepetirEv] = useState(false);
  const [importar, setImportar] = useState(false);
  const [sel, setSel] = useState<string[]>([]);

  if (!ajustes || ev === undefined || !ejercicios || !sesiones) return <Cargando />;

  if (!ajustes.moduloBrazo) {
    return (
      <div className="space-y-4">
        <PageHeader titulo="Brazo izquierdo" />
        <Aviso>
          El módulo está <strong>desactivado</strong>. Actívalo en Ajustes cuando quieras empezar.
        </Aviso>
        <Button asChild className="h-12 w-full rounded-2xl">
          <Link href="/ajustes/">Ir a Ajustes</Link>
        </Button>
      </div>
    );
  }

  if (!ev || repetirEv) {
    return (
      <div className="space-y-4">
        <PageHeader titulo="Autoevaluación" subtitulo="Brazo izquierdo · 2 minutos" />
        <Aviso tipo="warn">{AVISO}</Aviso>
        <Glass>
          <EvaluacionForm inicial={ev} onGuardada={() => setRepetirEv(false)} />
        </Glass>
      </div>
    );
  }

  const compatibles = ejerciciosCompatibles(ev).filter((c) => !ejercicios.some((e) => e.catalogoId === c.id));
  const activos = ejercicios.filter((e) => e.activo);
  const ultimas = [...sesiones].reverse().slice(0, 5);

  async function importarSeleccion() {
    const base = ejercicios!.length;
    const lista = ejerciciosCompatibles(ev!).filter((c) => sel.includes(c.id));
    for (const [i, c] of lista.entries()) {
      await guardar<ArmExercise>("armExercises", {
        id: nuevoId(),
        nombre: c.nombre,
        descripcion: c.descripcion,
        medida: c.medida,
        series: c.series,
        objetivo: c.objetivo,
        carga: c.carga,
        ilustracion: c.ilustracion,
        origen: "catalogo",
        catalogoId: c.id,
        activo: true,
        orden: base + i,
      });
    }
    toast.success(`${lista.length} ejercicios importados`);
    setSel([]);
    setImportar(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader titulo="Brazo izquierdo" subtitulo="5–15 min · sin dolor y sin forzar la muñeca" />
      <Aviso tipo="warn">{AVISO}</Aviso>

      <Glass>
        <SectionTitle
          accion={
            <Button variant="ghost" size="sm" onClick={() => setRepetirEv(true)}>
              <ClipboardCheck /> Repetir
            </Button>
          }
        >
          Autoevaluación · {formatoFecha(ev.fecha)}
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          Dolor en reposo {ev.dolorReposo}/10 · al moverlo {ev.dolorMovimiento}/10. Solo se te proponen ejercicios compatibles.
        </p>
      </Glass>

      <Glass>
        <SectionTitle>Días del brazo izquierdo</SectionTitle>
        <Chips<Weekday>
          multiple
          valor={ajustes.diasBrazo}
          onChange={(v) => guardarAjustes({ diasBrazo: v as Weekday[] })}
          opciones={SEMANA_LUNES.map((d) => ({ valor: d, etiqueta: NOMBRE_DIA_CORTO[d] }))}
        />
        <p className="mt-2 text-xs text-muted-foreground">Aparecerán en el plan semanal y el calendario.</p>
      </Glass>

      <section>
        <SectionTitle
          accion={
            <Button size="sm" className="rounded-xl" onClick={() => setEditar(borradorVacio(ejercicios.length))}>
              <Plus /> Añadir
            </Button>
          }
        >
          Mis ejercicios
        </SectionTitle>
        {activos.length === 0 && (
          <Aviso>
            Aún no tienes ejercicios. Añade los tuyos o importa ideas del catálogo compatibles con tu autoevaluación.
          </Aviso>
        )}
        <ul className="space-y-2">
          {ejercicios.map((e) => (
            <li key={e.id}>
              <Glass className="space-y-2 p-3">
                <div className="flex gap-3">
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary/60">
                    <Ilustracion clave={e.ilustracion} className="size-14" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.series} × {e.objetivo} {e.medida === "reps" ? "reps" : "s"} · {e.carga}
                      {e.origen === "profesional" && " · pautado por profesional"}
                    </p>
                    {e.descripcion && <p className="mt-1 text-xs text-foreground/80">{e.descripcion}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditar(e)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Borrar"
                      className="text-destructive"
                      onClick={async () => {
                        if (confirm(`¿Borrar «${e.nombre}»?`)) await borrar("armExercises", e.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={e.activo}
                    onCheckedChange={(v) => guardar<ArmExercise>("armExercises", { ...e, activo: v === true })}
                  />
                  Incluir en la sesión
                </label>
                {e.videoUrl && (
                  <a href={e.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary underline">
                    <ExternalLink className="size-3" /> Ver vídeo
                  </a>
                )}
                {e.mediaId && <VideoPropio mediaId={e.mediaId} />}
              </Glass>
            </li>
          ))}
        </ul>
        <Button variant="outline" className="mt-3 h-12 w-full rounded-2xl" onClick={() => setImportar(true)}>
          <Download /> Importar ideas del catálogo ({compatibles.length} compatibles)
        </Button>
      </section>

      {activos.length > 0 && (
        <Button asChild className="h-14 w-full rounded-2xl text-base font-semibold">
          <Link href="/brazo/sesion/">
            <Play /> Empezar sesión
          </Link>
        </Button>
      )}

      {ultimas.length > 0 && (
        <Glass>
          <SectionTitle>Últimas sesiones</SectionTitle>
          <ul className="space-y-1.5 text-sm">
            {ultimas.map((s) => (
              <li key={s.id} className="flex justify-between rounded-xl bg-secondary/50 px-3 py-2">
                <span>{formatoFecha(s.fecha, { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="text-muted-foreground">
                  dolor {s.dolorAntes} → {s.dolorDespues ?? "—"} · {s.entradas.length} ejercicios
                </span>
              </li>
            ))}
          </ul>
          <Link href="/progreso/?tab=brazo" className="mt-2 block text-center text-xs text-primary underline">
            Ver evolución
          </Link>
        </Glass>
      )}

      <EjercicioForm borrador={editar} onClose={() => setEditar(null)} />
      <Dialog open={importar} onOpenChange={setImportar}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hand className="size-5 text-violet" /> Ideas compatibles
            </DialogTitle>
            <DialogDescription>Filtradas por tu autoevaluación. Ninguna carga la muñeca ni exige agarre si no puedes.</DialogDescription>
          </DialogHeader>
          {compatibles.length === 0 && <p className="text-sm text-muted-foreground">Ya las tienes todas.</p>}
          <ul className="space-y-2">
            {compatibles.map((c) => (
              <li key={c.id}>
                <label className="flex gap-3 rounded-2xl bg-secondary/50 p-3">
                  <Checkbox
                    className="mt-1"
                    checked={sel.includes(c.id)}
                    onCheckedChange={(v) => setSel((s) => (v ? [...s, c.id] : s.filter((x) => x !== c.id)))}
                  />
                  <span>
                    <span className="block text-sm font-medium">{c.nombre}</span>
                    <span className="block text-xs text-muted-foreground">{c.descripcion}</span>
                    <span className="block text-xs text-primary">
                      {c.series} × {c.objetivo} {c.medida === "reps" ? "reps" : "s"} · {c.carga}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Button disabled={sel.length === 0} className="h-12 rounded-2xl" onClick={importarSeleccion}>
            Importar {sel.length || ""}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
