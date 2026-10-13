"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cabecera de página: título en Orbitron con degradado neón. */
export function PageHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="glitch font-display text-4xl uppercase leading-none tracking-wide text-foreground" data-text={titulo}>
          {titulo}
        </h1>
        <div className="trazo-rasgado mt-1.5 w-28" aria-hidden />
        {subtitulo && <p className="mt-2 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
      {accion}
    </header>
  );
}

/** Tarjeta de cristal con aparición suave. */
export function Glass({ className, children, ...props }: HTMLMotionProps<"section">) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("glass rounded-3xl p-4", className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function SectionTitle({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-heading text-xl tracking-wide">{children}</h2>
      {accion}
    </div>
  );
}

/** Selector numérico grande, pensado para usarse con el pulgar derecho. */
export function Stepper({
  valor,
  onChange,
  paso = 1,
  min = 0,
  max = 999,
  sufijo,
  etiqueta,
  decimales = 1,
}: {
  valor: number | null;
  onChange: (v: number | null) => void;
  paso?: number;
  min?: number;
  max?: number;
  sufijo?: string;
  etiqueta: string;
  decimales?: number;
}) {
  const fijar = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 10 ** decimales) / 10 ** decimales)));
  return (
    <div className="flex flex-col gap-1">
      <span className="text-center text-[11px] uppercase tracking-wider text-muted-foreground">{etiqueta}</span>
      <div className="flex items-center gap-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          aria-label={`Restar ${paso} a ${etiqueta}`}
          onClick={() => fijar((valor ?? 0) - paso)}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground active:bg-primary/20"
        >
          <Minus className="size-5" />
        </motion.button>
        <label className="relative flex-1">
          <span className="sr-only">{etiqueta}</span>
          <input
            inputMode="decimal"
            type="number"
            value={valor ?? ""}
            placeholder="—"
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value.replace(",", ".")))}
            className="h-12 w-full min-w-0 rounded-2xl border border-input bg-background/40 text-center font-heading text-2xl tabular-nums outline-none focus:border-primary tracking-wide"
          />
          {sufijo && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {sufijo}
            </span>
          )}
        </label>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          aria-label={`Sumar ${paso} a ${etiqueta}`}
          onClick={() => fijar((valor ?? 0) + paso)}
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-foreground active:bg-primary/20"
        >
          <Plus className="size-5" />
        </motion.button>
      </div>
    </div>
  );
}

/** Botones de selección tipo "chip". */
export function Chips<T extends string | number>({
  opciones,
  valor,
  onChange,
  multiple = false,
  className,
}: {
  opciones: { valor: T; etiqueta: React.ReactNode }[];
  valor: T | T[];
  onChange: (v: T | T[]) => void;
  multiple?: boolean;
  className?: string;
}) {
  const sel = (v: T) => (Array.isArray(valor) ? valor.includes(v) : valor === v);
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role={multiple ? "group" : "radiogroup"}>
      {opciones.map((o) => (
        <motion.button
          key={String(o.valor)}
          type="button"
          whileTap={{ scale: 0.95 }}
          role={multiple ? "checkbox" : "radio"}
          aria-checked={sel(o.valor)}
          onClick={() => {
            if (!multiple) return onChange(o.valor);
            const arr = Array.isArray(valor) ? valor : [];
            onChange(arr.includes(o.valor) ? arr.filter((x) => x !== o.valor) : [...arr, o.valor]);
          }}
          className={cn(
            "min-h-11 rounded-2xl border px-3.5 text-sm font-medium transition-colors",
            sel(o.valor)
              ? "border-primary/60 bg-primary/15 text-primary neon-border"
              : "border-border bg-secondary/60 text-foreground/85 hover:bg-secondary",
          )}
        >
          {o.etiqueta}
        </motion.button>
      ))}
    </div>
  );
}

export function Stat({ etiqueta, valor, detalle, color = "primary" }: {
  etiqueta: string;
  valor: React.ReactNode;
  detalle?: React.ReactNode;
  color?: "primary" | "violet" | "lime" | "warn";
}) {
  const colores = { primary: "text-primary", violet: "text-violet", lime: "text-lime", warn: "text-warn" };
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
      <div className={cn("font-display text-3xl tabular-nums", colores[color])}>{valor}</div>
      {detalle && <div className="text-xs text-muted-foreground">{detalle}</div>}
    </div>
  );
}

export function Aviso({ tipo = "info", children, className }: {
  tipo?: "info" | "warn" | "danger" | "ok";
  children: React.ReactNode;
  className?: string;
}) {
  const estilos = {
    info: "border-primary/30 bg-primary/10 text-foreground",
    warn: "border-warn/40 bg-warn/10 text-foreground",
    danger: "border-destructive/40 bg-destructive/10 text-foreground",
    ok: "border-lime/40 bg-lime/10 text-foreground",
  };
  return <div className={cn("rounded-2xl border p-3 text-sm leading-relaxed", estilos[tipo], className)}>{children}</div>;
}

export function Cargando() {
  return (
    <div className="grid min-h-[50dvh] place-items-center" aria-busy>
      <motion.div
        className="size-10 rounded-full border-2 border-primary/30 border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
    </div>
  );
}
