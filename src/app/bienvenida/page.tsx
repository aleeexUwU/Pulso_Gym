"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, HeartPulse, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/kakugan";
import { Landing } from "@/components/landing";
import { Aviso, Chips, Glass } from "@/components/ui-kit";
import { entradaGenerador } from "@/lib/app/planificacion";
import { usePerfil } from "@/lib/db/hooks";
import { escribirKv } from "@/lib/db/repo";
import { NOMBRE_DIA_CORTO, SEMANA_LUNES } from "@/lib/domain/dates";
import { ajustesPorDefecto, perfilPorDefecto } from "@/lib/domain/defaults";
import { generarPlan } from "@/lib/domain/generator";
import { LIMITACIONES } from "@/lib/domain/limitations";
import { EQUIPO_GIMNASIO_COMPLETO, EQUIPO_NOMBRE } from "@/lib/domain/muscles";
import type { Equipment, Experience, Goal, LimitationId, Profile, Sex, Weekday } from "@/lib/domain/types";

const PASOS = ["Antes de empezar", "Sobre ti", "Experiencia y objetivo", "Días y duración", "Material", "Limitaciones", "Resumen"];

const PRESETS: { nombre: string; equipo: Equipment[] }[] = [
  { nombre: "Gimnasio completo", equipo: EQUIPO_GIMNASIO_COMPLETO },
  {
    nombre: "Básico",
    equipo: ["mancuernas", "banco", "banco_inclinable", "polea", "prensa", "extension_cuadriceps", "curl_femoral", "esterilla"],
  },
  { nombre: "Solo mancuernas", equipo: ["mancuernas", "banco", "esterilla"] },
];

export default function Bienvenida() {
  const router = useRouter();
  const perfilGuardado = usePerfil();
  const [empezado, setEmpezado] = useState(false);
  const [paso, setPaso] = useState(0);
  const [p, setP] = useState<Profile>(() => perfilPorDefecto());
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));

  const ajustes = useMemo(() => ajustesPorDefecto(), []);
  const estimacion = useMemo(() => {
    if (p.dias.length === 0) return null;
    const plan = generarPlan(entradaGenerador(p, ajustes, null));
    const max = Math.max(...plan.dias.map((d) => d.duracionEstimadaMin));
    return { plan, max };
  }, [p, ajustes]);

  const puedeSeguir = paso === 0 ? p.avisoMedicoAceptado : paso === 3 ? p.dias.length >= 2 : true;

  async function crear() {
    setGuardando(true);
    try {
      const perfil = { ...p, creadoEn: new Date().toISOString() };
      await escribirKv("perfil", perfil);
      await escribirKv("ajustes", ajustes);
      await escribirKv("plan", generarPlan(entradaGenerador(perfil, ajustes, null)));
      toast.success("¡Rutina creada! Semana 1: calibración guiada.");
      router.replace("/");
    } finally {
      setGuardando(false);
    }
  }

  // Si al entrar con tu cuenta se descarga un perfil, directo a la app.
  useEffect(() => {
    if (perfilGuardado) router.replace("/");
  }, [perfilGuardado, router]);

  if (!empezado) return <Landing onEmpezar={() => setEmpezado(true)} />;

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs text-muted-foreground">
            Paso {paso + 1} de {PASOS.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--neon)] to-[var(--violet)]"
            animate={{ width: `${((paso + 1) / PASOS.length) * 100}%` }}
          />
        </div>
        <h1 className="mt-4 font-heading text-3xl tracking-wide">{PASOS[paso]}</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={paso}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="flex-1 space-y-4"
        >
          {paso === 0 && (
            <>
              <Glass>
                <p className="leading-relaxed">
                  Vas a crear una rutina de <strong>cuerpo completo</strong> en la que todo el tren superior se hace con el{" "}
                  <strong>brazo derecho</strong> y nada carga la mano o la muñeca izquierda. Además tendrás un{" "}
                  <strong>core diario en casa</strong> y un módulo para el brazo izquierdo que podrás activar cuando quieras.
                </p>
              </Glass>
              <Aviso tipo="warn">
                <div className="flex gap-2">
                  <HeartPulse className="mt-0.5 size-5 shrink-0 text-warn" />
                  <p>
                    Esta app es orientativa y no sustituye a un profesional. Antes de empezar, sobre todo tras mucho tiempo
                    sin entrenar y con una condición como la mano zamba radial, consulta con tu <strong>médico</strong> o{" "}
                    <strong>fisioterapeuta</strong>. Para cualquier dolor agudo, para y consulta.
                  </p>
                </div>
              </Aviso>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-secondary/60 p-3">
                <Checkbox
                  checked={p.avisoMedicoAceptado}
                  onCheckedChange={(v) => set("avisoMedicoAceptado", v === true)}
                  className="size-6"
                />
                <span className="text-sm">He leído el aviso y entreno bajo mi responsabilidad.</span>
              </label>
            </>
          )}

          {paso === 1 && (
            <Glass className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre (opcional)</Label>
                <Input id="nombre" value={p.nombre} onChange={(e) => set("nombre", e.target.value)} className="mt-1.5 h-12 rounded-2xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["edad", "Edad", "años"],
                    ["pesoKg", "Peso", "kg"],
                    ["alturaCm", "Altura", "cm"],
                  ] as const
                ).map(([k, et, suf]) => (
                  <div key={k}>
                    <Label htmlFor={k}>{et}</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id={k}
                        inputMode="decimal"
                        type="number"
                        value={p[k] ?? ""}
                        onChange={(e) => set(k, e.target.value === "" ? null : Number(e.target.value))}
                        className="h-12 rounded-2xl pr-9 text-center"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suf}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label>Sexo</Label>
                <Chips<Sex>
                  className="mt-1.5"
                  valor={p.sexo}
                  onChange={(v) => set("sexo", v as Sex)}
                  opciones={[
                    { valor: "hombre", etiqueta: "Hombre" },
                    { valor: "mujer", etiqueta: "Mujer" },
                    { valor: "otro", etiqueta: "Prefiero no decirlo" },
                  ]}
                />
              </div>
              <p className="text-xs text-muted-foreground">Se usan solo para estimar los pesos de la semana de calibración.</p>
            </Glass>
          )}

          {paso === 2 && (
            <Glass className="space-y-5">
              <div>
                <Label>Experiencia</Label>
                <Chips<Experience>
                  className="mt-1.5"
                  valor={p.experiencia}
                  onChange={(v) => set("experiencia", v as Experience)}
                  opciones={[
                    { valor: "principiante", etiqueta: "Principiante / retomo" },
                    { valor: "intermedio", etiqueta: "Intermedio" },
                    { valor: "avanzado", etiqueta: "Avanzado" },
                  ]}
                />
              </div>
              <div>
                <Label>Objetivo</Label>
                <Chips<Goal>
                  className="mt-1.5"
                  valor={p.objetivo}
                  onChange={(v) => set("objetivo", v as Goal)}
                  opciones={[
                    { valor: "hipertrofia", etiqueta: "Ganar músculo" },
                    { valor: "fuerza", etiqueta: "Fuerza" },
                    { valor: "salud", etiqueta: "Salud y forma" },
                  ]}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Cambia los rangos de repeticiones, descansos y las repeticiones en reserva (RIR).
                </p>
              </div>
            </Glass>
          )}

          {paso === 3 && (
            <>
              <Glass className="space-y-4">
                <div>
                  <Label>¿Qué días vas al gimnasio?</Label>
                  <Chips<Weekday>
                    multiple
                    className="mt-1.5"
                    valor={p.dias}
                    onChange={(v) => set("dias", v as Weekday[])}
                    opciones={SEMANA_LUNES.map((d) => ({ valor: d, etiqueta: NOMBRE_DIA_CORTO[d] }))}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    2–3 días: cuerpo completo · 4 o más: torso / pierna. Lo puedes cambiar cuando quieras.
                  </p>
                </div>
                <div>
                  <Label>Duración de cada sesión</Label>
                  <Chips<number>
                    className="mt-1.5"
                    valor={p.duracionMin}
                    onChange={(v) => set("duracionMin", v as number)}
                    opciones={[45, 60, 75, 90, 105, 120].map((m) => ({ valor: m, etiqueta: `${m} min` }))}
                  />
                </div>
              </Glass>
              {estimacion && (
                <Aviso tipo={estimacion.max > p.duracionMin + 10 ? "warn" : "ok"}>
                  Para que <strong>ningún grupo muscular</strong> se quede por debajo de {ajustes.seriesMinimas} series a la
                  semana, cada sesión dura <strong>~{estimacion.max} min</strong> (ya con biseries).
                  {estimacion.max > p.duracionMin + 10 && (
                    <> Si es mucho: añade un tercer día (~75 min) o baja el mínimo a 8 series en Ajustes (~90 min con 2 días).</>
                  )}
                </Aviso>
              )}
            </>
          )}

          {paso === 4 && (
            <Glass className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((pr) => (
                  <Button key={pr.nombre} variant="outline" className="h-10 rounded-2xl" onClick={() => set("equipo", pr.equipo)}>
                    {pr.nombre}
                  </Button>
                ))}
              </div>
              <Chips<Equipment>
                multiple
                valor={p.equipo}
                onChange={(v) => set("equipo", v as Equipment[])}
                opciones={(Object.keys(EQUIPO_NOMBRE) as Equipment[]).map((q) => ({ valor: q, etiqueta: EQUIPO_NOMBRE[q] }))}
              />
              <p className="text-xs text-muted-foreground">
                La máquina Smith solo se usará si para algún grupo no hay ninguna alternativa con tu material, y se marcará como
                último recurso. La barra libre nunca se usa.
              </p>
            </Glass>
          )}

          {paso === 5 && (
            <Glass className="space-y-3">
              {LIMITACIONES.map((l) => {
                const activa = p.limitaciones.includes(l.id);
                return (
                  <label key={l.id} className="flex min-h-12 items-start gap-3 rounded-2xl bg-secondary/50 p-3">
                    <Checkbox
                      checked={activa}
                      className="mt-0.5 size-5"
                      onCheckedChange={(v) =>
                        set(
                          "limitaciones",
                          v ? [...p.limitaciones, l.id] : p.limitaciones.filter((x: LimitationId) => x !== l.id),
                        )
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium">{l.nombre}</span>
                      <span className="block text-xs text-muted-foreground">{l.descripcion}</span>
                    </span>
                  </label>
                );
              })}
              <div>
                <Label htmlFor="notas">Notas sobre tus limitaciones</Label>
                <Textarea
                  id="notas"
                  value={p.notasLimitaciones}
                  onChange={(e) => set("notasLimitaciones", e.target.value)}
                  className="mt-1.5 min-h-24 rounded-2xl"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Aunque desmarques la mano izquierda, el módulo gimnasio sigue trabajando el tren superior solo con el brazo derecho.
              </p>
            </Glass>
          )}

          {paso === 6 && estimacion && (
            <Glass className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-5" /> <span className="font-semibold">Tu semana</span>
              </div>
              <ul className="space-y-2 text-sm">
                {estimacion.plan.dias.map((d) => (
                  <li key={d.id} className="flex justify-between rounded-2xl bg-secondary/50 px-3 py-2">
                    <span>{d.nombre}</span>
                    <span className="text-muted-foreground">
                      {d.ejercicios.length} ejercicios · ~{d.duracionEstimadaMin} min
                    </span>
                  </li>
                ))}
                <li className="flex justify-between rounded-2xl bg-secondary/50 px-3 py-2">
                  <span>Core en casa</span>
                  <span className="text-muted-foreground">cada día · 10–15 min</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                La <strong>semana 1 es de calibración</strong>: empezarás ligero y subirás serie a serie hasta un peso con el que te
                queden 2–3 repeticiones en reserva. Ese será tu punto de partida.
              </p>
            </Glass>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="safe-bottom sticky bottom-0 mt-6 flex gap-3 bg-gradient-to-t from-background via-background/90 to-transparent pt-4">
        {paso > 0 && (
          <Button variant="outline" className="h-14 flex-1 rounded-2xl text-base" onClick={() => setPaso(paso - 1)}>
            <ArrowLeft /> Atrás
          </Button>
        )}
        {paso < PASOS.length - 1 ? (
          <Button
            className="h-14 flex-[2] rounded-2xl text-base font-semibold"
            disabled={!puedeSeguir}
            onClick={() => setPaso(paso + 1)}
          >
            Siguiente <ArrowRight />
          </Button>
        ) : (
          <Button className="h-14 flex-[2] rounded-2xl text-base font-semibold" disabled={guardando} onClick={crear}>
            Crear mi rutina <Sparkles />
          </Button>
        )}
      </div>
    </div>
  );
}
