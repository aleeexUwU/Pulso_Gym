"use client";

import { AlertTriangle, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { TecnicaContenido } from "@/components/exercise/technique";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cargando, Chips, Glass, PageHeader } from "@/components/ui-kit";
import { usePerfil } from "@/lib/db/hooks";
import { EJERCICIOS, getEjercicio } from "@/lib/domain/exercises";
import { ejercicioPermitido } from "@/lib/domain/limitations";
import { GRUPO_NOMBRE, GRUPOS } from "@/lib/domain/muscles";
import type { MuscleGroup } from "@/lib/domain/types";

function Biblioteca() {
  const params = useSearchParams();
  const router = useRouter();
  const perfil = usePerfil();
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState<MuscleGroup | "todos">("todos");
  const id = params.get("id");

  if (perfil === undefined) return <Cargando />;

  const detalle = id ? getEjercicio(id) : undefined;
  if (detalle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="rounded-xl" onClick={() => router.back()}>
          <ArrowLeft /> Volver
        </Button>
        <PageHeader titulo={detalle.nombre} />
        <TecnicaContenido ejercicio={detalle} />
      </div>
    );
  }

  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const lista = EJERCICIOS.filter(
    (e) =>
      (grupo === "todos" || (e.musculos[grupo] ?? 0) >= 1) && (!q || norm(e.nombre).includes(norm(q))),
  );

  return (
    <div className="space-y-4">
      <PageHeader titulo="Biblioteca" subtitulo={`${EJERCICIOS.length} ejercicios adaptados con técnica en español`} />
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="sr-only">Buscar ejercicio</span>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="h-12 rounded-xl pl-9" />
      </label>
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <Chips<MuscleGroup | "todos">
          className="w-max flex-nowrap"
          valor={grupo}
          onChange={(v) => setGrupo(v as MuscleGroup | "todos")}
          opciones={[{ valor: "todos", etiqueta: "Todos" }, ...GRUPOS.map((g) => ({ valor: g, etiqueta: GRUPO_NOMBRE[g] }))]}
        />
      </div>
      <ul className="space-y-2">
        {lista.map((e) => {
          const permitido = !perfil || e.modulo !== "gimnasio" || ejercicioPermitido(e, { equipo: perfil.equipo, limitaciones: perfil.limitaciones, excluidos: perfil.excluidos });
          return (
            <li key={e.id}>
              <Link href={`/ejercicios/?id=${e.id}`}>
                <Glass className="flex items-center gap-3 p-2.5">
                  <ExerciseImage ejercicio={e} animar={false} className="size-16 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.modulo === "abdominales" ? "Core en casa" : "Gimnasio"} ·{" "}
                      {Object.entries(e.musculos)
                        .filter(([, w]) => (w ?? 0) >= 1)
                        .map(([g]) => GRUPO_NOMBRE[g as MuscleGroup])
                        .join(", ")}
                    </p>
                    {e.smith && (
                      <p className="flex items-center gap-1 text-xs text-warn">
                        <AlertTriangle className="size-3" /> Último recurso
                      </p>
                    )}
                    {!permitido && <p className="text-xs text-muted-foreground">No disponible con tu material o limitaciones</p>}
                  </div>
                </Glass>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Pagina() {
  return (
    <Suspense fallback={<Cargando />}>
      <Biblioteca />
    </Suspense>
  );
}
