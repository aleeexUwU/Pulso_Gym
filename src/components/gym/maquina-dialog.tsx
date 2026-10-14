"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chips } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { configurarMaquina } from "@/lib/app/gimnasio";
import type { PesosMaquina } from "@/lib/domain/progression";

const PASOS = [1, 2, 2.5, 4, 5, 7, 10];
const num = (x: number) => String(x).replace(".", ",");

/**
 * "Pesos de esta máquina": de cuánto en cuánto sube y el peso más bajo. A partir de ahí
 * la app solo propone pesos que existen en esa máquina.
 */
export function MaquinaDialog({
  exerciseId,
  nombre,
  actual,
  workoutId,
  abierto,
  onOpenChange,
}: {
  exerciseId: string;
  nombre: string;
  actual: PesosMaquina | undefined;
  workoutId: string;
  abierto: boolean;
  onOpenChange: (a: boolean) => void;
}) {
  const [paso, setPaso] = useState(actual?.paso ?? 5);
  const [minimo, setMinimo] = useState(String(actual?.minimo ?? actual?.paso ?? 5).replace(".", ","));
  const min = Math.max(0, Number(minimo.replace(",", ".")) || 0);
  const ejemplo = Array.from({ length: 6 }, (_, i) => Math.round((min + i * paso) * 100) / 100);

  async function guardar(cfg: PesosMaquina | null) {
    await configurarMaquina(exerciseId, cfg, workoutId);
    toast.success(cfg ? `Pesos de ${nombre}: de ${num(cfg.paso)} en ${num(cfg.paso)} kg` : "Vuelve a usar los incrementos generales");
    onOpenChange(false);
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" /> Pesos de esta máquina
          </DialogTitle>
          <DialogDescription>{nombre}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm">¿De cuánto en cuánto sube?</p>
            <Chips<number> valor={paso} onChange={(v) => setPaso(v as number)} opciones={PASOS.map((p) => ({ valor: p, etiqueta: `${num(p)} kg` }))} />
          </div>
          <label className="block space-y-1.5 text-sm">
            Peso más bajo (la primera placa o el primer agujero)
            <Input inputMode="decimal" value={minimo} onChange={(e) => setMinimo(e.target.value)} className="h-11 w-32 rounded-xl" />
          </label>
          <p className="rounded-xl bg-secondary/60 p-2.5 text-sm tabular-nums">
            Pesos posibles: {ejemplo.map(num).join(", ")}… kg
          </p>
          <div className="flex gap-2">
            {actual && (
              <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => guardar(null)}>
                Quitar
              </Button>
            )}
            <Button className="h-12 flex-1 rounded-2xl" onClick={() => guardar({ paso, minimo: min })}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
