"use client";

import { CloudOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseConfigurado } from "@/lib/sync/supabase";
import { suscribirSync, type EstadoSync } from "@/lib/sync/sync";

/** Avisa en el inicio si este dispositivo no está sincronizando (sin sesión o con error). */
export function AvisoSync() {
  const [estado, setEstado] = useState<EstadoSync | null>(null);
  useEffect(() => suscribirSync(setEstado), []);
  if (!supabaseConfigurado || !estado || (estado.tipo !== "sin_sesion" && estado.tipo !== "error")) return null;
  return (
    <Link href="/ajustes/" className="flex gap-3 rounded-2xl border border-warn/50 bg-warn/10 p-3 text-sm">
      <CloudOff className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
      <span>
        {estado.tipo === "sin_sesion" ? (
          <>
            <strong>Este dispositivo no tiene la sesión iniciada</strong>, así que no se sincroniza con los demás. Entra en
            Ajustes → Cuenta con tu email.
          </>
        ) : (
          <>
            <strong>No se pudo sincronizar:</strong> {estado.mensaje}. Pulsa para reintentar en Ajustes → Cuenta.
          </>
        )}
      </span>
    </Link>
  );
}
