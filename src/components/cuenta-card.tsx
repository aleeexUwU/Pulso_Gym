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
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState("");

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
          if (error) {
            toast.error(
              /rate limit/i.test(error.message)
                ? "Has pedido demasiados correos seguidos. Espera unos minutos y vuelve a intentarlo."
                : error.message,
            );
          } else {
            setEnviado(true);
            toast.success("Correo enviado. Abre el enlace o escribe aquí el código.");
          }
        }}
      >
        <p className="text-sm text-muted-foreground">
          Inicia sesión con tu email para guardar tus datos en la nube. Te llegará un correo con un enlace y un código.
        </p>
        <div className="flex gap-2">
          <Input type="email" required autoComplete="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" aria-label="Email" />
          <Button type="submit" className="h-12 rounded-xl" disabled={enviando}>
            <Mail /> {enviado ? "Reenviar" : "Enviar"}
          </Button>
        </div>
        {enviado && (
          <div className="space-y-2 rounded-xl bg-secondary/50 p-3">
            <p className="text-sm">
              ¿El enlace no te deja dentro? Escribe el <strong>código de 6 dígitos</strong> del correo:
            </p>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                className="h-12 rounded-xl text-center font-heading text-2xl tracking-[0.3em]"
                aria-label="Código del correo"
              />
              <Button
                type="button"
                className="h-12 rounded-xl"
                disabled={codigo.length < 6}
                onClick={async () => {
                  const { error } = await supabase()!.auth.verifyOtp({ email, token: codigo, type: "email" });
                  if (error) toast.error(/expired|invalid/i.test(error.message) ? "Código incorrecto o caducado. Pide otro." : error.message);
                  else toast.success("¡Sesión iniciada!");
                }}
              >
                Entrar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Si no llega en unos minutos, mira en spam.</p>
          </div>
        )}
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
