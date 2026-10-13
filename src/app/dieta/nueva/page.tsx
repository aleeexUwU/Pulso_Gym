"use client";

import { Barcode, Camera, Keyboard, Loader2, PenLine, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EscanerCodigo } from "@/components/dieta/escaner-codigo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Aviso, Cargando, Chips, Glass, PageHeader, SectionTitle, Stepper } from "@/components/ui-kit";
import { analizarConIA, comprimirImagen, guardarComida, iaDisponible, TIPOS_COMIDA, tipoPorHora, totales } from "@/lib/app/dieta";
import { buscarPorCodigo, type ProductoOFF } from "@/lib/app/openfoodfacts";
import { useComidas } from "@/lib/db/hooks";
import type { Comida, TipoComida } from "@/lib/db/types";
import { hoyISO } from "@/lib/domain/dates";
import { ALIMENTOS, nutrientesDe } from "@/lib/domain/nutrition/alimentos";
import { analizarTexto, cambiarGramos, itemDeAlimento, normalizar, type ItemComida } from "@/lib/domain/nutrition/parser";
import { cn } from "@/lib/utils";

type Modo = "foto" | "codigo" | "texto" | "manual";

function ahoraHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Editor({ inicial, fecha }: { inicial: Comida | null; fecha: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(inicial ? "texto" : "foto");
  const [tipo, setTipo] = useState<TipoComida>(inicial?.tipo ?? tipoPorHora(new Date().getHours() + new Date().getMinutes() / 60));
  const [hora, setHora] = useState(inicial?.hora ?? ahoraHHMM());
  const [texto, setTexto] = useState(inicial?.descripcion ?? "");
  const [items, setItems] = useState<ItemComida[]>(inicial?.items ?? []);
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [notasIA, setNotasIA] = useState(inicial?.notasIA ?? "");
  const [fuente, setFuente] = useState<Comida["fuente"]>(inicial?.fuente ?? "texto");
  const [foto, setFoto] = useState<{ blob: Blob; base64: string; url: string } | null>(null);
  const [sinReconocer, setSinReconocer] = useState<string[]>([]);
  const [usarIA, setUsarIA] = useState(true);
  const [ia, setIa] = useState<{ ok: boolean; motivo?: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [producto, setProducto] = useState<ProductoOFF | null>(null);
  const [gramosProducto, setGramosProducto] = useState<number | null>(100);
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  const [manual, setManual] = useState({ nombre: "", gramos: 100, kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });

  useEffect(() => {
    void iaDisponible().then(setIa);
  }, []);
  useEffect(() => () => void (foto && URL.revokeObjectURL(foto.url)), [foto]);

  const t = totales([{ items } as Comida]);
  const resultados = useMemo(() => {
    const q = normalizar(busqueda);
    if (q.length < 2) return [];
    return ALIMENTOS.filter((a) => normalizar(a.nombre).includes(q) || a.alias.some((al) => normalizar(al).includes(q))).slice(0, 6);
  }, [busqueda]);

  async function elegirFoto(f: File | undefined) {
    if (!f) return;
    try {
      const { base64, blob } = await comprimirImagen(f);
      setFoto({ base64, blob, url: URL.createObjectURL(blob) });
    } catch {
      toast.error("No se pudo leer la foto.");
    }
  }

  async function leerCodigo(codigo: string) {
    setBuscandoCodigo(true);
    setProducto(null);
    try {
      const p = await buscarPorCodigo(codigo);
      if (!p) return toast.error(`No encuentro el producto ${codigo} en Open Food Facts. Añádelo en «Manual».`);
      setProducto(p);
      setGramosProducto(p.racionG ?? 100);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo buscar el producto.");
    } finally {
      setBuscandoCodigo(false);
    }
  }

  async function analizar() {
    setCargando(true);
    try {
      if (modo === "foto") {
        if (!foto) return toast.error("Haz o elige una foto primero.");
        const r = await analizarConIA({ imagenBase64: foto.base64, texto: texto || undefined });
        setItems(r.items);
        setDescripcion(r.descripcion);
        setNotasIA(r.notas);
        setFuente("ia-foto");
        setSinReconocer([]);
      } else if (usarIA && ia?.ok) {
        const r = await analizarConIA({ texto });
        setItems(r.items);
        setDescripcion(r.descripcion);
        setNotasIA(r.notas);
        setFuente("ia-texto");
        setSinReconocer([]);
      } else {
        const r = analizarTexto(texto);
        setItems(r.items);
        setDescripcion(texto);
        setNotasIA("");
        setFuente("texto");
        setSinReconocer(r.sinReconocer);
        if (r.items.length === 0) toast.error("No he reconocido ningún alimento. Prueba con otras palabras o añádelo a mano.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo analizar.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarTodo() {
    if (items.length === 0) return toast.error("Añade al menos un alimento.");
    await guardarComida(
      {
        id: inicial?.id,
        fecha: inicial?.fecha ?? fecha,
        hora,
        tipo,
        descripcion: descripcion || items.map((i) => i.nombre).join(", "),
        items,
        fuente: inicial && fuente === inicial.fuente ? inicial.fuente : fuente,
        notasIA: notasIA || undefined,
        fotoMediaId: inicial?.fotoMediaId,
      },
      foto?.blob,
    );
    toast.success("Comida guardada");
    router.push(`/dieta/${(inicial?.fecha ?? fecha) === hoyISO() ? "" : `?fecha=${inicial?.fecha ?? fecha}`}`);
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader titulo={inicial ? "Editar comida" : "Añadir comida"} />

      <Glass className="space-y-4">
        <Chips<TipoComida> valor={tipo} onChange={(v) => setTipo(v as TipoComida)} opciones={TIPOS_COMIDA} />
        <div className="flex items-center gap-2">
          <Label htmlFor="hora" className="text-sm text-muted-foreground">
            Hora
          </Label>
          <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-11 w-32 rounded-xl" />
        </div>
      </Glass>

      <div className="grid grid-cols-4 gap-2" role="tablist" aria-label="Cómo añadir la comida">
        {(
          [
            ["foto", "Foto", Camera],
            ["codigo", "Código", Barcode],
            ["texto", "Escribir", Keyboard],
            ["manual", "Manual", PenLine],
          ] as const
        ).map(([m, et, Icono]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-sm",
              modo === m ? "border-primary/60 bg-primary/15 text-primary neon-border" : "border-border bg-secondary/50",
            )}
          >
            <Icono className="size-5" /> {et}
          </button>
        ))}
      </div>

      {modo === "foto" && (
        <Glass className="space-y-3">
          {ia && !ia.ok && <Aviso tipo="warn">{ia.motivo} Mientras tanto puedes escribirlo o añadirlo a mano.</Aviso>}
          <label
            className={cn(
              "relative grid min-h-48 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground",
            )}
          >
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local
              <img src={foto.url} alt="Foto de la comida" className="max-h-80 w-full object-contain" />
            ) : (
              <span className="flex flex-col items-center gap-2 p-6 text-center">
                <Camera className="size-8 text-primary" /> Hacer una foto o elegirla de la galería
              </span>
            )}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => elegirFoto(e.target.files?.[0])} />
          </label>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Opcional: detalles que no se ven (p. ej. 'con aceite', 'la mitad', 'leche desnatada')"
            className="min-h-16 rounded-2xl"
          />
          <Button className="h-14 w-full rounded-2xl text-base font-semibold" disabled={!foto || cargando || !ia?.ok} onClick={analizar}>
            {cargando ? <Loader2 className="animate-spin" /> : <Sparkles />} Analizar foto con IA
          </Button>
        </Glass>
      )}

      {modo === "codigo" && (
        <Glass className="space-y-3">
          <EscanerCodigo onCodigo={leerCodigo} buscando={buscandoCodigo} />
          {producto && (
            <div className="space-y-3 rounded-2xl bg-secondary/50 p-3">
              <div className="flex gap-3">
                {producto.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagen externa de Open Food Facts
                  <img src={producto.imagen} alt="" className="size-16 shrink-0 rounded-xl bg-white object-contain" />
                )}
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{producto.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {producto.marca} · {Math.round(producto.por100.kcal)} kcal / 100 g · P {producto.por100.proteinas} · C{" "}
                    {producto.por100.carbohidratos} · G {producto.por100.grasas}
                  </p>
                  {producto.racionTexto && <p className="text-xs text-muted-foreground">Ración de la etiqueta: {producto.racionTexto}</p>}
                </div>
              </div>
              <Stepper etiqueta="Cantidad que has tomado" sufijo="g" paso={10} decimales={0} valor={gramosProducto} onChange={setGramosProducto} />
              <Button
                className="h-12 w-full rounded-2xl"
                disabled={!gramosProducto}
                onClick={() => {
                  const g = Math.max(1, gramosProducto ?? 100);
                  const n = nutrientesDe(producto.por100, g);
                  const r = (x: number) => Math.round(x * 10) / 10;
                  setItems((xs) => [
                    ...xs,
                    {
                      nombre: producto.marca ? `${producto.nombre} (${producto.marca})` : producto.nombre,
                      gramos: g,
                      por100: producto.por100,
                      confianza: "alta",
                      kcal: Math.round(n.kcal),
                      proteinas: r(n.proteinas),
                      carbohidratos: r(n.carbohidratos),
                      grasas: r(n.grasas),
                      fibra: r(n.fibra),
                      azucares: r(n.azucares),
                      sal: Math.round(n.sal * 100) / 100,
                    },
                  ]);
                  if (items.length === 0) setFuente("codigo");
                  setProducto(null);
                  toast.success("Añadido");
                }}
              >
                <Plus /> Añadir a la comida
              </Button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">Datos de productos: Open Food Facts (licencia ODbL), base de datos colaborativa.</p>
        </Glass>
      )}

      {modo === "texto" && (
        <Glass className="space-y-3">
          <Label htmlFor="texto">¿Qué has comido?</Label>
          <Textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="2 huevos, una tostada con aceite y un café con leche"
            className="min-h-24 rounded-2xl"
          />
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Usar IA (más preciso)
              <span className="block text-xs text-muted-foreground">
                {ia?.ok ? "Analiza con Claude." : (ia?.motivo ?? "Comprobando…")} Sin IA uso la tabla de alimentos del móvil.
              </span>
            </span>
            <Switch checked={usarIA && !!ia?.ok} disabled={!ia?.ok} onCheckedChange={setUsarIA} />
          </label>
          <Button className="h-14 w-full rounded-2xl text-base font-semibold" disabled={!texto.trim() || cargando} onClick={analizar}>
            {cargando ? <Loader2 className="animate-spin" /> : <Sparkles />} Calcular
          </Button>
          {sinReconocer.length > 0 && (
            <Aviso tipo="warn">
              No he reconocido: <strong>{sinReconocer.join(", ")}</strong>. Búscalo abajo o añádelo en «Manual».
            </Aviso>
          )}
        </Glass>
      )}

      {modo === "manual" && (
        <Glass className="space-y-3">
          <Input placeholder="Nombre (p. ej. Barrita de proteína)" value={manual.nombre} onChange={(e) => setManual({ ...manual, nombre: e.target.value })} className="h-11 rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["gramos", "Gramos"],
                ["kcal", "Kcal"],
                ["proteinas", "Proteína"],
                ["carbohidratos", "Carbos"],
                ["grasas", "Grasas"],
              ] as const
            ).map(([k, et]) => (
              <label key={k} className="text-xs text-muted-foreground">
                {et}
                <Input
                  type="number"
                  inputMode="decimal"
                  value={manual[k]}
                  onChange={(e) => setManual({ ...manual, [k]: Number(e.target.value) || 0 })}
                  className="mt-1 h-11 rounded-xl text-center"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Valores del total que has comido (míralos en la etiqueta).</p>
          <Button
            variant="secondary"
            className="h-12 w-full rounded-2xl"
            disabled={!manual.nombre || manual.kcal <= 0}
            onClick={() => {
              const n = { ...manual, fibra: 0, azucares: 0, sal: 0 };
              setItems((xs) => [
                ...xs,
                { ...n, gramos: Math.max(1, manual.gramos), confianza: "alta", por100: nutrientesDe(n, (100 / Math.max(1, manual.gramos)) * 100) },
              ]);
              setFuente(items.length ? fuente : "manual");
              setManual({ nombre: "", gramos: 100, kcal: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });
            }}
          >
            <Plus /> Añadir
          </Button>
        </Glass>
      )}

      <Glass className="space-y-3">
        <SectionTitle>Alimentos ({items.length})</SectionTitle>
        {notasIA && <p className="rounded-xl bg-violet/10 p-2.5 text-xs leading-relaxed">{notasIA}</p>}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay alimentos. Analiza, busca o añade a mano.</p>}
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="space-y-2 rounded-2xl bg-secondary/50 p-3">
              <div className="flex items-start gap-2">
                <Input
                  aria-label="Nombre del alimento"
                  value={it.nombre}
                  onChange={(e) => setItems((xs) => xs.map((x, k) => (k === i ? { ...x, nombre: e.target.value } : x)))}
                  className="h-10 flex-1 rounded-xl"
                />
                <Button variant="ghost" size="icon" className="text-destructive" aria-label="Quitar" onClick={() => setItems((xs) => xs.filter((_, k) => k !== i))}>
                  <Trash2 />
                </Button>
              </div>
              <Stepper
                etiqueta="Gramos"
                sufijo="g"
                paso={10}
                decimales={0}
                valor={it.gramos}
                onChange={(v) => v != null && v > 0 && setItems((xs) => xs.map((x, k) => (k === i ? cambiarGramos(x, v) : x)))}
              />
              <p className="text-xs tabular-nums text-muted-foreground">
                <strong className="text-foreground">{Math.round(it.kcal)} kcal</strong> · P {it.proteinas} · C {it.carbohidratos} · G {it.grasas} · fibra {it.fibra} g
                {it.confianza === "baja" && " · cantidad estimada, revísala"}
              </p>
            </li>
          ))}
        </ul>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Buscar alimento</span>
          <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Añadir de la tabla: arroz, pollo, yogur…" className="h-11 rounded-xl pl-9" />
        </label>
        {resultados.length > 0 && (
          <ul className="space-y-1">
            {resultados.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/60 px-3 py-2 text-left text-sm"
                  onClick={() => {
                    setItems((xs) => [...xs, itemDeAlimento(a, a.unidad ?? a.racion, "media")]);
                    setBusqueda("");
                  }}
                >
                  <span>{a.nombre}</span>
                  <span className="text-xs text-muted-foreground">{a.kcal} kcal/100 g</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Glass>

      <div className="glass sticky bottom-2 flex items-center gap-3 p-3">
        <div className="flex-1 text-sm">
          <p className="font-display text-3xl tabular-nums text-primary">{Math.round(t.kcal)} kcal</p>
          <p className="text-xs text-muted-foreground">
            P {Math.round(t.proteinas)} · C {Math.round(t.carbohidratos)} · G {Math.round(t.grasas)} g
          </p>
        </div>
        <Button className="h-14 rounded-2xl px-6 text-base font-semibold" disabled={items.length === 0} onClick={guardarTodo}>
          Guardar
        </Button>
      </div>
    </div>
  );
}

function Pagina() {
  const params = useSearchParams();
  const id = params.get("id");
  const fecha = params.get("fecha") ?? hoyISO();
  const comidas = useComidas();
  if (id && !comidas) return <Cargando />;
  const inicial = id ? (comidas?.find((c) => c.id === id) ?? null) : null;
  return <Editor key={id ?? "nueva"} inicial={inicial} fecha={fecha} />;
}

export default function NuevaComida() {
  return (
    <Suspense fallback={<Cargando />}>
      <Pagina />
    </Suspense>
  );
}
