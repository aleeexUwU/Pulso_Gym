"use client";

import { AlertTriangle, CheckCircle2, Hand, NotebookPen, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useNota } from "@/lib/db/hooks";
import { guardar } from "@/lib/db/repo";
import type { ExerciseNote } from "@/lib/db/types";
import { getEjercicio } from "@/lib/domain/exercises";
import { EQUIPO_NOMBRE, GRUPO_NOMBRE } from "@/lib/domain/muscles";
import type { Exercise, MuscleGroup } from "@/lib/domain/types";
import { ExerciseImage } from "./exercise-image";

export function MusculosBadges({ ejercicio }: { ejercicio: Exercise }) {
  const lista = (Object.entries(ejercicio.musculos) as [MuscleGroup, number][]).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map(([g, w]) => (
        <Badge
          key={g}
          variant={w >= 1 ? "default" : "secondary"}
          className={w >= 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"}
        >
          {GRUPO_NOMBRE[g]}
          {w < 1 && ` · ${w === 0.5 ? "½" : "¼"}`}
        </Badge>
      ))}
    </div>
  );
}

/** Nota persistente por ejercicio (p. ej. "asiento en el 4"). Se guarda al escribir. */
export function NotaEjercicio({ exerciseId }: { exerciseId: string }) {
  const nota = useNota(exerciseId);
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    if (nota !== undefined && texto === null) setTexto(nota?.texto ?? "");
  }, [nota, texto]);
  useEffect(() => {
    if (texto === null || texto === (nota?.texto ?? "")) return;
    const t = setTimeout(() => void guardar<ExerciseNote>("notas", { id: exerciseId, texto }), 500);
    return () => clearTimeout(t);
  }, [texto, nota, exerciseId]);
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <NotebookPen className="size-4 text-violet" /> Mis notas
      </span>
      <Textarea
        value={texto ?? ""}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ajustes de la máquina, sensaciones, recordatorios…"
        className="min-h-20 rounded-2xl"
      />
    </label>
  );
}

export function TecnicaContenido({ ejercicio }: { ejercicio: Exercise }) {
  const pref = ejercicio.alternativaPreferida ? getEjercicio(ejercicio.alternativaPreferida) : undefined;
  return (
    <div className="space-y-4">
      <ExerciseImage ejercicio={ejercicio} className="aspect-[4/3] w-full" />
      <MusculosBadges ejercicio={ejercicio} />
      {ejercicio.equipo.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Material: {ejercicio.equipo.map((q) => EQUIPO_NOMBRE[q]).join(" · ")}
        </p>
      )}
      {ejercicio.smith && (
        <div className="flex gap-2 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <p>
            <strong>Último recurso.</strong> Solo se usa si no tienes otra opción con tu material.
            {pref && <> Preferible: {pref.nombre}.</>}
          </p>
        </div>
      )}
      {ejercicio.adaptacion && (
        <div className="flex gap-2 rounded-2xl border border-violet/40 bg-violet/10 p-3 text-sm">
          <Hand className="mt-0.5 size-4 shrink-0 text-violet" />
          <p>
            <strong>Adaptación:</strong> {ejercicio.adaptacion}
          </p>
        </div>
      )}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <CheckCircle2 className="size-4 text-lime" /> Pasos clave
        </h3>
        <ol className="space-y-2 text-sm leading-relaxed">
          {ejercicio.pasos.map((p, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <XCircle className="size-4 text-destructive" /> Errores comunes
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {ejercicio.errores.map((e, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden>•</span>
              {e}
            </li>
          ))}
        </ul>
      </section>
      <NotaEjercicio exerciseId={ejercicio.id} />
      {ejercicio.imagen && (
        <p className="text-[11px] text-muted-foreground">Imágenes: free-exercise-db (dominio público).</p>
      )}
    </div>
  );
}

export function TecnicaSheet({
  exerciseId,
  onOpenChange,
}: {
  exerciseId: string | null;
  onOpenChange: (abierto: boolean) => void;
}) {
  const e = exerciseId ? getEjercicio(exerciseId) : undefined;
  return (
    <Sheet open={!!e} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-8">
        {e && (
          <>
            <SheetHeader className="px-0">
              <SheetTitle className="font-heading text-lg">{e.nombre}</SheetTitle>
              <SheetDescription>Técnica, errores y adaptación</SheetDescription>
            </SheetHeader>
            <TecnicaContenido ejercicio={e} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
