"use client";

import { Cloud, CloudOff, LogOut, Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, supabaseConfigurado } from "@/lib/sync/supabase";
import { sincronizar, suscribirSync, type EstadoSync } from "@/lib/sync/sync";

/** Cuenta (enlace mágico por email) y estado de la sincronización con Supabase. */
export function CuentaCard() {
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoSync>({ tipo: "local" });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => suscribirSync(setEstado), []);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => setUsuario(data.user?.email ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setUsuario(s?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigurado) {
    return (
      <div className="flex gap-3 text-sm">
        <CloudOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p>
          <strong>Modo local.</strong> Todo se guarda en este dispositivo (funciona sin conexión). Para sincronizar entre
          dispositivos, configura Supabase (ver README) y vuelve a desplegar.
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          const { error } = await supabase()!.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/ajustes/` },
          });
          setEnviando(false);
          if (error) toast.error(error.message);
          else toast.success("Te he enviado un enlace. Ábrelo en este mismo dispositivo.");
        }}
      >
        <p className="text-sm text-muted-foreground">Inicia sesión con un enlace por email para guardar tus datos en la nube.</p>
        <div className="flex gap-2">
          <Input type="email" required autoComplete="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" aria-label="Email" />
          <Button type="submit" className="h-12 rounded-xl" disabled={enviando}>
            <Mail /> Enviar
          </Button>
        </div>
      </form>
    );
  }

  const texto =
    estado.tipo === "sincronizando"
      ? "Sincronizando…"
      : estado.tipo === "ok"
        ? `Sincronizado ${new Date(estado.cuando).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
        : estado.tipo === "error"
          ? `Error: ${estado.mensaje}`
          : "Pendiente";
  return (
    <div className="space-y-3 text-sm">
      <p className="flex items-center gap-2">
        <Cloud className="size-5 text-primary" /> {usuario}
      </p>
      <p className="text-muted-foreground">{texto}</p>
      <div className="flex gap-2">
        <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => sincronizar()}>
          <RefreshCw /> Sincronizar ahora
        </Button>
        <Button variant="ghost" className="h-11 rounded-xl" onClick={() => supabase()!.auth.signOut()}>
          <LogOut /> Salir
        </Button>
      </div>
    </div>
  );
}
