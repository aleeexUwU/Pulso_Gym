"use client";

import { Barcode, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { EscanerCodigo } from "@/components/dieta/escaner-codigo";
import { ListaAlimentos } from "@/components/dieta/lista-alimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Aviso, Cargando, Glass, PageHeader, Stepper } from "@/components/ui-kit";
import { analizarConIA, iaDisponible, totales } from "@/lib/app/dieta";
import { buscarPorCodigo, itemDeProducto, type ProductoOFF } from "@/lib/app/openfoodfacts";
import { borrarReceta, guardarReceta } from "@/lib/app/recetas";
import { useRecetas } from "@/lib/db/hooks";
import type { Comida, Receta } from "@/lib/db/types";
import { analizarTexto, type ItemComida } from "@/lib/domain/nutrition/parser";

function Editor({ inicial }: { inicial: Receta | null }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<ItemComida[]>(inicial?.items ?? []);
  const [notasIA, setNotasIA] = useState("");
  const [sinReconocer, setSinReconocer] = useState<string[]>([]);
  const [ia, setIa] = useState<{ ok: boolean; motivo?: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [escaner, setEscaner] = useState(false);
  const [producto, setProducto] = useState<ProductoOFF | null>(null);
  const [gramosProducto, setGramosProducto] = useState<number | null>(30);
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);

  useEffect(() => {
    void iaDisponible().then(setIa);
  }, []);

  const t = totales([{ items } as Comida]);

  /** Lo analizado se AÑADE a lo que ya hay, para poder ir sumando ingredientes. */
  async function calcular() {
    setCargando(true);
    try {
      if (ia?.ok) {
        try {
          const r = await analizarConIA({ texto: `Batido o receta casera: ${texto}` });
          setItems((xs) => [...xs, ...r.items]);
          setNotasIA(r.notas);
          setSinReconocer([]);
          if (!nombre.trim() && r.descripcion) setNombre(r.descripcion.slice(0, 40));
          setTexto("");
          return;
        } catch (e) {
          toast.warning(`${e instanceof Error ? e.message : "La IA falló"} He usado la tabla de alimentos del móvil.`);
        }
      }
      const r = analizarTexto(texto);
      setItems((xs) => [...xs, ...r.items]);
      setSinReconocer(r.sinReconocer);
      if (r.items.length === 0) toast.error("No he reconocido ningún ingrediente. Prueba con otras palabras o búscalo abajo.");
      else setTexto("");
    } finally {
      setCargando(false);
    }
  }

  async function leerCodigo(codigo: string) {
    setBuscandoCodigo(true);
    setProducto(null);
    try {
      const p = await buscarPorCodigo(codigo);
      if (!p) return toast.error(`No encuentro el producto ${codigo}. Escríbelo arriba o búscalo en la tabla.`);
      setProducto(p);
      setGramosProducto(p.racionG ?? 30);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo buscar el producto.");
    } finally {
      setBuscandoCodigo(false);
    }
  }

  async function guardar() {
    if (!nombre.trim()) return toast.error("Ponle un nombre al batido.");
    if (items.length === 0) return toast.error("Añade al menos un ingrediente.");
    await guardarReceta({ id: inicial?.id, nombre, items });
    toast.success(`«${nombre.trim()}» guardado`);
    router.push("/dieta/batidos/");
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader titulo={inicial ? "Editar batido" : "Nuevo batido"} subtitulo="Guárdalo una vez y añádelo a tu dieta con un toque" />

      <Glass className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Batido de proteína con avena"
          maxLength={60}
          className="h-12 rounded-xl text-base"
        />
      </Glass>

      <Glass className="space-y-3">
        <Label htmlFor="ingredientes">¿Qué le echas?</Label>
        <Textarea
          id="ingredientes"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="300 ml de leche desnatada, un plátano, 30 g de whey de chocolate, 40 g de copos de avena y una cucharada de crema de cacahuete"
          className="min-h-28 rounded-2xl"
        />
        <p className="text-xs text-muted-foreground">
          {ia?.ok
            ? "La IA calcula cada ingrediente. Pon cantidades si las sabes; si no, usa raciones normales."
            : `${ia?.motivo ?? "Comprobando la IA…"} Sin IA uso la tabla de alimentos del móvil.`}
        </p>
        <Button className="h-14 w-full rounded-2xl text-base font-semibold" disabled={!texto.trim() || cargando} onClick={calcular}>
          {cargando ? <Loader2 className="animate-spin" /> : <Sparkles />} {items.length ? "Añadir ingredientes" : "Calcular"}
        </Button>
        {sinReconocer.length > 0 && (
          <Aviso tipo="warn">
            No he reconocido: <strong>{sinReconocer.join(", ")}</strong>. Búscalo abajo en la tabla.
          </Aviso>
        )}
        <Button variant="ghost" className="w-full" onClick={() => setEscaner((v) => !v)} aria-expanded={escaner}>
          <Barcode /> {escaner ? "Cerrar escáner" : "Escanear un ingrediente (proteína, bebida…)"}
        </Button>
        {escaner && (
          <div className="space-y-3">
            <EscanerCodigo onCodigo={leerCodigo} buscando={buscandoCodigo} />
            {producto && (
              <div className="space-y-3 rounded-2xl bg-secondary/50 p-3">
                <p className="font-medium leading-tight">
                  {producto.nombre}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {producto.marca} · {Math.round(producto.por100.kcal)} kcal / 100 g · P {producto.por100.proteinas}
                  </span>
                </p>
                <Stepper etiqueta="Cantidad que le echas" sufijo="g" paso={5} decimales={0} valor={gramosProducto} onChange={setGramosProducto} />
                <Button
                  className="h-12 w-full rounded-2xl"
                  disabled={!gramosProducto}
                  onClick={() => {
                    setItems((xs) => [...xs, itemDeProducto(producto, gramosProducto ?? 30)]);
                    setProducto(null);
                    toast.success("Ingrediente añadido");
                  }}
                >
                  <Plus /> Añadir al batido
                </Button>
              </div>
            )}
          </div>
        )}
      </Glass>

      <ListaAlimentos
        items={items}
        setItems={setItems}
        notasIA={notasIA}
        titulo="Ingredientes"
        vacio="Aún no hay ingredientes. Escribe lo que le echas y pulsa Calcular."
      />

      {inicial && (
        <Button
          variant="ghost"
          className="w-full text-destructive"
          onClick={async () => {
            if (!confirm(`¿Borrar «${inicial.nombre}»? Las comidas ya registradas no se tocan.`)) return;
            await borrarReceta(inicial.id);
            toast.success("Batido borrado");
            router.push("/dieta/batidos/");
          }}
        >
          <Trash2 /> Borrar batido
        </Button>
      )}

      <div className="glass sticky bottom-2 flex items-center gap-3 p-3">
        <div className="flex-1 text-sm">
          <p className="font-display text-3xl tabular-nums text-primary">{Math.round(t.kcal)} kcal</p>
          <p className="text-xs text-muted-foreground">
            P {Math.round(t.proteinas)} · C {Math.round(t.carbohidratos)} · G {Math.round(t.grasas)} g
          </p>
        </div>
        <Button className="h-14 rounded-2xl px-6 text-base font-semibold" disabled={items.length === 0 || !nombre.trim()} onClick={guardar}>
          Guardar batido
        </Button>
      </div>
    </div>
  );
}

function Pagina() {
  const id = useSearchParams().get("id");
  const recetas = useRecetas();
  if (id && !recetas) return <Cargando />;
  const inicial = id ? (recetas?.find((r) => r.id === id) ?? null) : null;
  return <Editor key={id ?? "nuevo"} inicial={inicial} />;
}

export default function EditarBatido() {
  return (
    <Suspense fallback={<Cargando />}>
      <Pagina />
    </Suspense>
  );
}
