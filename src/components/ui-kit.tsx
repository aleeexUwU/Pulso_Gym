"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Ciempies } from "@/components/ciempies";
import { cn } from "@/lib/utils";

/**
 * Cabecera de página. Al hacer scroll y perder de vista el título grande, aparece
 * una barra fija y compacta arriba con el mismo título (como en las apps nativas).
 */
export function PageHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  accion?: React.ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCompacta(!e.isIntersecting), { rootMargin: "-12px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <AnimatePresence>
        {compacta && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="safe-top fixed inset-x-0 top-0 z-30 mx-auto max-w-xl border-b border-border bg-background/85 backdrop-blur-md lg:hidden"
            aria-hidden
          >
            <p className="safe-x py-2.5 font-display text-2xl leading-none">{titulo}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 ref={ref} className="glitch font-display text-4xl uppercase leading-none tracking-wide text-foreground" data-text={titulo}>
            {titulo}
          </h1>
          <div className="trazo-rasgado mt-1.5 w-28" aria-hidden />
          {subtitulo && <p className="mt-2 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
        {accion}
      </header>
    </>
  );
}

/** Número que cuenta desde 0 hasta su valor al aparecer (y entre valores al cambiar). */
export function NumeroAnimado({ valor, decimales = 0 }: { valor: number; decimales?: number }) {
  const mv = useMotionValue(0);
  const texto = useTransform(mv, (v) => v.toFixed(decimales));
  useEffect(() => {
    const reducido = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducido) {
      mv.set(valor);
      return;
    }
    const c = animate(mv, valor, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
    return () => c.stop();
  }, [valor, mv]);
  return <motion.span className="tabular-nums">{texto}</motion.span>;
}

/**
 * Tarjeta de cristal. Aparece con un fundido CSS que empieza ya visible (opacidad 0,5):
 * si el navegador no llegara a animar, la tarjeta se ve igual (nunca queda invisible).
 */
export function Glass({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section className={cn("glass aparecer rounded-3xl p-4", className)} {...props}>
      {children}
    </section>
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
      <span className="text-center text-[11px] text-muted-foreground">{etiqueta}</span>
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
      <div className="text-[11px] text-muted-foreground">{etiqueta}</div>
      <div className={cn("font-display text-3xl tabular-nums", colores[color])}>
        {typeof valor === "number" ? <NumeroAnimado valor={valor} /> : valor}
      </div>
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
    <div className="grid min-h-[50dvh] place-items-center" aria-busy aria-label="Cargando">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }}>
        <Ciempies recorrido="enroscado" segmentos={16} grosor={15} className="size-20 opacity-80" />
      </motion.div>
    </div>
  );
}
