"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chips } from "@/components/ui-kit";
import { db } from "@/lib/db/db";
import { guardar, nuevoId } from "@/lib/db/repo";
import type { ArmExercise } from "@/lib/db/types";

const ILUSTRACIONES = [
  { valor: "elevacion_lateral", etiqueta: "Elevación lateral" },
  { valor: "elevacion_frontal", etiqueta: "Elevación frontal" },
  { valor: "flexion_codo", etiqueta: "Codo" },
  { valor: "rotacion", etiqueta: "Rotación" },
  { valor: "isometrico", etiqueta: "Isométrico / mano" },
];

export type BorradorEjercicio = Omit<ArmExercise, "updatedAt" | "_dirty">;

export function borradorVacio(orden: number): BorradorEjercicio {
  return {
    id: nuevoId(),
    nombre: "",
    descripcion: "",
    medida: "reps",
    series: 2,
    objetivo: 10,
    carga: "Sin carga",
    origen: "propio",
    activo: true,
    orden,
    ilustracion: "elevacion_lateral",
  };
}

/** Alta y edición de un ejercicio propio del brazo izquierdo (con vídeo o enlace). */
export function EjercicioForm({
  borrador,
  onClose,
}: {
  borrador: BorradorEjercicio | null;
  onClose: () => void;
}) {
  const [b, setB] = useState<BorradorEjercicio | null>(borrador);
  const [archivo, setArchivo] = useState<File | null>(null);
  if (borrador && b?.id !== borrador.id) setB(borrador);
  const set = <K extends keyof BorradorEjercicio>(k: K, v: BorradorEjercicio[K]) => setB((x) => (x ? { ...x, [k]: v } : x));

  async function guardarEjercicio() {
    if (!b || !b.nombre.trim()) return toast.error("Ponle un nombre");
    let mediaId = b.mediaId;
    if (archivo) {
      if (archivo.size > 80 * 1024 * 1024) return toast.error("El vídeo pesa más de 80 MB");
      mediaId = mediaId ?? nuevoId();
      await db().media.put({ id: mediaId, blob: archivo, tipo: archivo.type, nombre: archivo.name });
    }
    await guardar<ArmExercise>("armExercises", { ...b, mediaId });
    toast.success("Ejercicio guardado");
    setArchivo(null);
    onClose();
  }

  return (
    <Dialog open={!!borrador} onOpenChange={(a) => !a && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{b?.nombre ? "Editar ejercicio" : "Nuevo ejercicio"}</DialogTitle>
          <DialogDescription>Añade lo que te paute tu fisioterapeuta o terapeuta de mano.</DialogDescription>
        </DialogHeader>
        {b && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bi-nombre">Nombre</Label>
              <Input id="bi-nombre" value={b.nombre} onChange={(e) => set("nombre", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="bi-desc">Descripción</Label>
              <Textarea id="bi-desc" value={b.descripcion} onChange={(e) => set("descripcion", e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Medida</Label>
              <Chips<ArmExercise["medida"]>
                className="mt-1.5"
                valor={b.medida}
                onChange={(v) => set("medida", v as ArmExercise["medida"])}
                opciones={[
                  { valor: "reps", etiqueta: "Repeticiones" },
                  { valor: "segundos", etiqueta: "Tiempo (s)" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bi-series">Series</Label>
                <Input id="bi-series" type="number" inputMode="numeric" value={b.series} onChange={(e) => set("series", Number(e.target.value) || 1)} className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="bi-obj">{b.medida === "reps" ? "Reps" : "Segundos"}</Label>
                <Input id="bi-obj" type="number" inputMode="numeric" value={b.objetivo} onChange={(e) => set("objetivo", Number(e.target.value) || 1)} className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <Label htmlFor="bi-carga">Carga (banda, lastre…)</Label>
              <Input id="bi-carga" value={b.carga} onChange={(e) => set("carga", e.target.value)} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Origen</Label>
              <Chips<ArmExercise["origen"]>
                className="mt-1.5"
                valor={b.origen}
                onChange={(v) => set("origen", v as ArmExercise["origen"])}
                opciones={[
                  { valor: "propio", etiqueta: "Mío" },
                  { valor: "profesional", etiqueta: "Pautado por un profesional" },
                  { valor: "catalogo", etiqueta: "Catálogo" },
                ]}
              />
            </div>
            <div>
              <Label>Ilustración</Label>
              <Chips<string>
                className="mt-1.5"
                valor={b.ilustracion ?? ""}
                onChange={(v) => set("ilustracion", v as string)}
                opciones={ILUSTRACIONES}
              />
            </div>
            <div>
              <Label htmlFor="bi-url">Enlace a vídeo (opcional)</Label>
              <Input id="bi-url" type="url" placeholder="https://…" value={b.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value || undefined)} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm">
              <Upload className="size-4 text-primary" />
              {archivo ? archivo.name : b.mediaId ? "Vídeo propio guardado · cambiar" : "Subir un vídeo propio (se guarda solo en este móvil)"}
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            </label>
            <Button className="h-12 w-full rounded-2xl" onClick={guardarEjercicio}>
              Guardar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
