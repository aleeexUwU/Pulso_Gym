"use client";

import { HeartPulse, Loader2, Plus, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Aviso } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { iaDisponible } from "@/lib/app/dieta";
import { adaptarConIA, type PropuestaIA } from "@/lib/app/limitaciones";
import { getEjercicio } from "@/lib/domain/exercises";
import { detectarLimitaciones, LIMITACIONES } from "@/lib/domain/limitations";
import type { LimitationId } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/**
 * Personalización por limitaciones físicas. Nada viene marcado: la persona cuenta con
 * sus palabras lo que le pasa (opcional) y la app le sugiere qué adaptar. Con la IA
 * autorizada, además propone qué ejercicios quitar.
 */
export function LimitacionesEditor({
  limitaciones,
  notas,
  onLimitaciones,
  onNotas,
  onExcluir,
  conIA = false,
}: {
  limitaciones: LimitationId[];
  notas: string;
  onLimitaciones: (ids: LimitationId[]) => void;
  onNotas: (texto: string) => void;
  /** Si se pasa, se pueden aplicar los ejercicios a quitar que proponga la IA. */
  onExcluir?: (ids: string[]) => void;
  conIA?: boolean;
}) {
  const [texto, setTexto] = useState(notas);
  const [ia, setIa] = useState<{ ok: boolean; motivo?: string } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [propuesta, setPropuesta] = useState<PropuestaIA | null>(null);

  useEffect(() => {
    if (conIA) void iaDisponible().then(setIa);
  }, [conIA]);

  // Guarda lo escrito poco después de dejar de teclear (y al salir del campo).
  const onNotasRef = useRef(onNotas);
  useEffect(() => {
    onNotasRef.current = onNotas;
  });
  useEffect(() => {
    if (texto === notas) return;
    const t = setTimeout(() => onNotasRef.current(texto), 700);
    return () => clearTimeout(t);
  }, [texto, notas]);

  const sugeridas = detectarLimitaciones(texto).filter((id) => !limitaciones.includes(id));
  const nombre = (id: LimitationId) => LIMITACIONES.find((l) => l.id === id)?.nombre ?? id;
  const alternar = (id: LimitationId, on: boolean) =>
    onLimitaciones(on ? [...new Set([...limitaciones, id])] : limitaciones.filter((x) => x !== id));

  async function analizar() {
    setAnalizando(true);
    setPropuesta(null);
    try {
      setPropuesta(await adaptarConIA(texto));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo analizar.");
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notas-limitaciones">¿Tienes alguna lesión, molestia o limitación física?</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Opcional. Cuéntalo con tus palabras (qué te pasa, desde cuándo, qué movimientos te molestan) y adaptamos la rutina.
          Si no tienes nada, déjalo en blanco.
        </p>
        <Textarea
          id="notas-limitaciones"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => texto !== notas && onNotas(texto)}
          placeholder="Ej.: me operaron de la rodilla derecha hace un año y me molesta al bajar mucho en sentadilla"
          className="mt-1.5 min-h-24 rounded-2xl"
        />
      </div>

      {sugeridas.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm">Por lo que cuentas, quizá te sirva adaptar:</p>
          <div className="flex flex-wrap gap-2">
            {sugeridas.map((id) => (
              <Button key={id} size="sm" variant="secondary" className="rounded-xl" onClick={() => alternar(id, true)}>
                <Plus /> {nombre(id)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {conIA && ia?.ok && (
        <Button variant="outline" className="h-12 w-full rounded-2xl" disabled={!texto.trim() || analizando} onClick={analizar}>
          {analizando ? <Loader2 className="animate-spin" /> : <Sparkles />} Adaptar mi rutina con IA
        </Button>
      )}

      {propuesta && (
        <div className="space-y-3 rounded-2xl border border-violet/40 bg-violet/10 p-3 text-sm">
          <p className="leading-relaxed">{propuesta.resumen}</p>
          {propuesta.consultar_profesional && (
            <p className="flex gap-2 text-warn">
              <HeartPulse className="mt-0.5 size-4 shrink-0" /> Antes de entrenar esto, consúltalo con tu médico o fisioterapeuta.
            </p>
          )}
          {propuesta.limitaciones.length > 0 && <p>Adaptar: {propuesta.limitaciones.map(nombre).join(", ")}.</p>}
          {propuesta.excluir.length > 0 && (
            <p>Quitar: {propuesta.excluir.map((id) => getEjercicio(id)?.nombre ?? id).join(", ")}.</p>
          )}
          <Button
            className="w-full rounded-xl"
            onClick={() => {
              onLimitaciones([...new Set([...limitaciones, ...propuesta.limitaciones])]);
              if (propuesta.excluir.length) onExcluir?.(propuesta.excluir);
              setPropuesta(null);
              toast.success("Rutina adaptada");
            }}
          >
            Aplicar
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">O márcalas tú:</p>
        {LIMITACIONES.map((l) => {
          const activa = limitaciones.includes(l.id);
          return (
            <label key={l.id} className={cn("flex items-start gap-3 rounded-xl p-3", activa ? "bg-primary/10" : "bg-secondary/50")}>
              <Checkbox className="mt-0.5 size-5" checked={activa} onCheckedChange={(v) => alternar(l.id, !!v)} />
              <span>
                <span className="block text-sm font-medium">{l.nombre}</span>
                <span className="block text-xs text-muted-foreground">{l.descripcion}</span>
              </span>
            </label>
          );
        })}
      </div>

      {conIA && ia && !ia.ok && ia.motivo?.includes("no está activada") && (
        <Aviso>La adaptación con IA no está activada para tu cuenta; puedes marcar las limitaciones a mano.</Aviso>
      )}
    </div>
  );
}
