"use client";

import { AlertTriangle, Check, CupSoda, ChevronLeft, ChevronRight, CircleAlert, Info, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { GraficaBarras } from "@/components/charts";
import { BatidosRapidos } from "@/components/dieta/batidos-rapidos";
import { FotoLocal } from "@/components/dieta/foto-local";
import { Button } from "@/components/ui/button";
import { Aviso, Cargando, Glass, NumeroAnimado, PageHeader, SectionTitle } from "@/components/ui-kit";
import { TIPOS_COMIDA, totales } from "@/lib/app/dieta";
import { useAjustes, useComidas, usePerfil, usePlan } from "@/lib/db/hooks";
import { borrar } from "@/lib/db/repo";
import { diaSemana, formatoFecha, hoyISO, sumarDias } from "@/lib/domain/dates";
import { consejosDelDia, objetivosDiarios } from "@/lib/domain/nutrition/objetivos";
import { cn } from "@/lib/utils";

function Barra({ etiqueta, valor, objetivo, unidad, maximo = false }: {
  etiqueta: string;
  valor: number;
  objetivo: number;
  unidad: string;
  /** true = es un tope (sal, azúcar): pasarse es lo malo. */
  maximo?: boolean;
}) {
  const pct = objetivo > 0 ? valor / objetivo : 0;
  const estado = maximo ? (pct > 1 ? "alto" : "ok") : pct > 1.1 ? "alto" : pct >= 0.9 ? "ok" : "falta";
  const Icono = estado === "ok" ? Check : estado === "alto" ? AlertTriangle : CircleAlert;
  const texto = estado === "ok" ? "bien" : estado === "alto" ? (maximo ? "por encima del máximo" : "te has pasado") : "falta";
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{etiqueta}</span>
        <span className="flex items-center gap-1 tabular-nums">
          <Icono className={cn("size-3.5", estado === "ok" ? "text-lime" : "text-warn")} aria-hidden />
          <strong>{valor < 10 ? valor.toFixed(1) : Math.round(valor)}</strong>
          <span className="text-muted-foreground">
            / {objetivo} {unidad}
            {maximo && " máx."}
          </span>
        </span>
      </div>
      <div
        className="relative h-2.5 overflow-hidden rounded-[3px] bg-secondary"
        role="meter"
        aria-label={`${etiqueta}: ${Math.round(valor)} de ${objetivo} ${unidad} (${texto})`}
        aria-valuenow={Math.round(valor)}
        aria-valuemin={0}
        aria-valuemax={objetivo}
      >
        <div
          className={cn(
            "h-full rounded-[3px] transition-[width]",
            estado === "ok" ? "bg-lime/85" : estado === "alto" ? "text-warn rayado" : "bg-gradient-to-r from-[var(--neon)] to-[var(--violet)]",
          )}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </li>
  );
}

function Dieta() {
  const router = useRouter();
  const params = useSearchParams();
  const perfil = usePerfil();
  const ajustes = useAjustes();
  const plan = usePlan();
  const comidas = useComidas();
  const hoy = hoyISO();
  const fecha = params.get("fecha") ?? hoy;

  const semana = useMemo(() => {
    if (!comidas) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const f = sumarDias(fecha, i - 6);
      return { fecha: f, kcal: Math.round(totales(comidas.filter((c) => c.fecha === f)).kcal) };
    });
  }, [comidas, fecha]);

  if (!perfil || !ajustes || !comidas || plan === undefined) return <Cargando />;

  const obj = objetivosDiarios(perfil, ajustes.dieta);
  const delDia = comidas.filter((c) => c.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora));
  const t = totales(delDia);
  const hora = fecha < hoy ? 24 : fecha > hoy ? 0 : new Date().getHours();
  const entrenoHoy = !!plan?.dias.some((d) => d.diaSemana === diaSemana(fecha));
  const consejos = consejosDelDia(t, obj, hora, { entrenoHoy });
  const irA = (f: string) => router.replace(f === hoy ? "/dieta/" : `/dieta/?fecha=${f}`);

  return (
    <div className="space-y-5 lg:grid lg:items-start lg:gap-10 lg:space-y-0 lg:grid-cols-2">
      <div className="space-y-5">
        <PageHeader
          titulo="Dieta"
          subtitulo={`Objetivo: ${obj.objetivo === "ganar" ? "ganar músculo" : obj.objetivo === "perder" ? "perder grasa" : "mantener"} · ${obj.kcal} kcal`}
        />

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon-lg" aria-label="Día anterior" onClick={() => irA(sumarDias(fecha, -1))}>
            <ChevronLeft />
          </Button>
          <p className="font-heading text-2xl tracking-wide">
            {fecha === hoy ? "Hoy" : formatoFecha(fecha, { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <Button variant="ghost" size="icon-lg" aria-label="Día siguiente" disabled={fecha >= hoy} onClick={() => irA(sumarDias(fecha, 1))}>
            <ChevronRight />
          </Button>
      </div>

      <Glass className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Calorías</p>
            <p className="font-display text-5xl tabular-nums text-primary">
              <NumeroAnimado valor={Math.round(t.kcal)} />
            </p>
          </div>
          <p className="pb-1 text-right text-sm text-muted-foreground">
            de {obj.kcal} kcal
            <br />
            {obj.kcal - t.kcal >= 0 ? `quedan ${Math.round(obj.kcal - t.kcal)}` : `+${Math.round(t.kcal - obj.kcal)} de más`}
          </p>
        </div>
        <ul className="space-y-3">
          <Barra etiqueta="Calorías" valor={t.kcal} objetivo={obj.kcal} unidad="kcal" />
          <Barra etiqueta="Proteína" valor={t.proteinas} objetivo={obj.proteinas} unidad="g" />
          <Barra etiqueta="Carbohidratos" valor={t.carbohidratos} objetivo={obj.carbohidratos} unidad="g" />
          <Barra etiqueta="Grasas" valor={t.grasas} objetivo={obj.grasas} unidad="g" />
          <Barra etiqueta="Fibra" valor={t.fibra} objetivo={obj.fibra} unidad="g" />
          <Barra etiqueta="Azúcares" valor={t.azucares} objetivo={obj.azucaresMax} unidad="g" maximo />
          <Barra etiqueta="Sal" valor={t.sal} objetivo={obj.salMax} unidad="g" maximo />
        </ul>
      </Glass>

      <div className="space-y-2">
        {consejos.map((c, i) => (
          <Aviso key={i} tipo={c.nivel === "aviso" ? "warn" : c.nivel === "ok" ? "ok" : "info"}>
            <div className="flex gap-2">
              {c.nivel === "aviso" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
              ) : c.nivel === "ok" ? (
                <Check className="mt-0.5 size-4 shrink-0 text-lime" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0" />
              )}
              <p>{c.texto}</p>
            </div>
          </Aviso>
        ))}
        {obj.notas.map((n) => (
          <Aviso key={n}>{n}</Aviso>
        ))}
      </div>

      </div>
      <div className="space-y-5">
        <Button asChild className="h-14 w-full rounded-2xl text-base font-semibold">
          <Link href={`/dieta/nueva/?fecha=${fecha}`}>
            <Plus /> Añadir comida
          </Link>
        </Button>

        <BatidosRapidos fecha={fecha} />

        <section className="space-y-3">
          <SectionTitle>Comidas</SectionTitle>
          {delDia.length === 0 && <p className="text-sm text-muted-foreground">Nada registrado este día.</p>}
          {TIPOS_COMIDA.map(({ valor, etiqueta }) => {
            const lista = delDia.filter((c) => c.tipo === valor);
            if (lista.length === 0) return null;
            return (
              <div key={valor} className="space-y-2">
                <h3 className="text-xs text-muted-foreground">{etiqueta}</h3>
                {lista.map((c) => {
                  const tc = totales([c]);
                  return (
                    <Glass key={c.id} className="space-y-2 p-3">
                      <div className="flex gap-3">
                        {c.fotoMediaId && <FotoLocal mediaId={c.fotoMediaId} className="size-16 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                            {c.fuente.startsWith("ia") && <Sparkles className="size-3.5 shrink-0 text-violet" aria-label="Analizado con IA" />}
                            {c.fuente === "receta" && <CupSoda className="size-3.5 shrink-0 text-primary" aria-label="Batido guardado" />}
                            <span className="truncate">{c.descripcion || c.items.map((i) => i.nombre).join(", ")}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.hora} · <strong className="text-foreground">{Math.round(tc.kcal)} kcal</strong> · P {Math.round(tc.proteinas)} · C{" "}
                            {Math.round(tc.carbohidratos)} · G {Math.round(tc.grasas)} g
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {c.items.map((i) => `${i.nombre} ${i.gramos} g`).join(" · ")}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <Button asChild variant="ghost" size="icon" aria-label="Editar comida">
                            <Link href={`/dieta/nueva/?id=${c.id}`}>
                              <Pencil />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            aria-label="Borrar comida"
                            onClick={() => confirm("¿Borrar esta comida?") && borrar("comidas", c.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </Glass>
                  );
                })}
              </div>
            );
          })}
        </section>

        <Glass>
          <SectionTitle>Últimos 7 días</SectionTitle>
          <p className="-mt-2 mb-2 text-xs text-muted-foreground">Calorías por día · objetivo {obj.kcal} kcal</p>
          <GraficaBarras datos={semana} x="fecha" unidad="kcal" series={[{ clave: "kcal", nombre: "Calorías", color: "1" }]} />
        </Glass>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Estimaciones orientativas, no sustituyen a un dietista-nutricionista. Ajusta el objetivo en{" "}
          <Link href="/ajustes/" className="underline">
            Ajustes
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function Pagina() {
  return (
    <Suspense fallback={<Cargando />}>
      <Dieta />
    </Suspense>
  );
}
