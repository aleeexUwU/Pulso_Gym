"use client";

import { ChefHat, Loader2, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { iaDisponible } from "@/lib/app/dieta";
import { ideasConIA, type IdeaIA } from "@/lib/app/ideas";
import { sumarNutrientes } from "@/lib/domain/nutrition/alimentos";
import type { Falta } from "@/lib/domain/nutrition/completar";
import type { ItemComida } from "@/lib/domain/nutrition/parser";

/**
 * "Con lo que tengo en la nevera": la IA propone 3 platos con esos ingredientes que
 * encajan con la próxima comida. Solo aparece si la IA está activada para la cuenta.
 */
export function IdeasNevera({
  objetivo,
  momento,
  limitaciones,
  onAnadir,
}: {
  objetivo: Falta;
  momento: "snack" | "comida";
  limitaciones?: string;
  onAnadir: (nombre: string, items: ItemComida[]) => void;
}) {
  const [ia, setIa] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [nevera, setNevera] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ideas, setIdeas] = useState<IdeaIA[]>([]);

  useEffect(() => {
    void iaDisponible().then((r) => setIa(r.ok));
  }, []);
  if (!ia) return null;

  async function pedir() {
    setCargando(true);
    try {
      setIdeas(await ideasConIA(nevera, objetivo, momento, limitaciones));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron generar ideas.");
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={() => setAbierto(true)}>
        <ChefHat /> Ideas con lo que tengo en la nevera
      </Button>
    );
  }

  const n = (x: number) => Math.round(x);
  return (
    <div className="space-y-3 rounded-2xl border border-violet/40 bg-violet/5 p-3">
      <label htmlFor="nevera" className="block text-sm font-medium">
        ¿Qué tienes en la nevera?
      </label>
      <Textarea
        id="nevera"
        value={nevera}
        onChange={(e) => setNevera(e.target.value)}
        placeholder="Pollo, arroz, calabacín, huevos, queso fresco, tomate…"
        className="min-h-20 rounded-xl"
      />
      <Button className="h-11 w-full rounded-xl" disabled={!nevera.trim() || cargando} onClick={pedir}>
        {cargando ? <Loader2 className="animate-spin" /> : <Sparkles />} Proponer platos
      </Button>
      <ul className="space-y-2">
        {ideas.map((i) => {
          const t = sumarNutrientes(...i.items);
          return (
            <li key={i.nombre} className="space-y-1.5 rounded-2xl bg-secondary/50 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{i.nombre}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {i.minutos} min · {n(t.kcal)} kcal · P {n(t.proteinas)} · C {n(t.carbohidratos)} · G {n(t.grasas)}
                  </p>
                </div>
                <Button size="sm" className="shrink-0 rounded-xl" onClick={() => onAnadir(i.nombre, i.items)}>
                  <Plus /> Añadir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{i.items.map((it) => `${it.nombre} ${it.gramos} g`).join(" · ")}</p>
              <details className="text-xs">
                <summary className="cursor-pointer text-primary">Cómo se hace</summary>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-muted-foreground">
                  {i.pasos.map((p, k) => (
                    <li key={k}>{p}</li>
                  ))}
                </ol>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
