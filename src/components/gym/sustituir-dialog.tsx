"use client";

import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { MusculosBadges } from "@/components/exercise/technique";
import { filtroGimnasio } from "@/lib/app/planificacion";
import { useAjustes } from "@/lib/db/hooks";
import { getEjercicio } from "@/lib/domain/exercises";
import { alternativas } from "@/lib/domain/substitution";
import type { Profile } from "@/lib/domain/types";

/** Lista de alternativas equivalentes que respetan limitaciones y material. */
export function SustituirDialog({
  exerciseId,
  perfil,
  ocupados,
  onElegir,
  onClose,
}: {
  exerciseId: string | null;
  perfil: Profile;
  ocupados: string[];
  onElegir: (nuevoId: string) => void;
  onClose: () => void;
}) {
  const ajustes = useAjustes();
  const original = exerciseId ? getEjercicio(exerciseId) : undefined;
  const lista = original ? alternativas(original.id, filtroGimnasio(perfil, ajustes), ocupados).slice(0, 8) : [];
  return (
    <Dialog open={!!original} onOpenChange={(a) => !a && onClose()}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-primary" /> Sustituir
          </DialogTitle>
          <DialogDescription>{original?.nombre}</DialogDescription>
        </DialogHeader>
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay alternativas con tu material y limitaciones.</p>
        )}
        <ul className="space-y-2">
          {lista.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onElegir(e.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-2 text-left hover:border-primary/50"
              >
                <ExerciseImage ejercicio={e} animar={false} className="size-16 shrink-0" />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-sm font-medium leading-tight">{e.nombre}</span>
                  <MusculosBadges ejercicio={e} />
                  {e.smith && (
                    <span className="flex items-center gap-1 text-xs text-warn">
                      <AlertTriangle className="size-3" /> Último recurso
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
