"use client";

import { Cloud, CloudOff, Eye, EyeOff, LogIn, LogOut, RefreshCw, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, supabaseConfigurado } from "@/lib/sync/supabase";
import { sincronizar, suscribirSync, type EstadoSync } from "@/lib/sync/sync";

/** Traduce los errores de Supabase Auth más habituales. */
function mensajeError(m: string): string {
  if (/invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
  if (/already registered|already been registered/i.test(m)) return "Ese email ya tiene cuenta: pulsa «Entrar».";
  if (/password should be at least|weak password/i.test(m)) return "La contraseña es demasiado corta o débil (mínimo 8 caracteres).";
  if (/email not confirmed/i.test(m)) return "Ese email está pendiente de confirmar. Pide ayuda para activarlo.";
  if (/signups? not allowed|signup is disabled/i.test(m)) return "El registro de cuentas nuevas está cerrado.";
  if (/rate limit/i.test(m)) return "Demasiados intentos seguidos. Espera unos minutos.";
  return m;
}

/** Cuenta (email y contraseña) y estado de la sincronización con Supabase. */
export function CuentaCard() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoSync>({ tipo: "local" });
  const [ocupado, setOcupado] = useState(false);

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

  async function acceder(modo: "entrar" | "crear") {
    if (!email || clave.length < 8) return toast.error("Escribe tu email y una contraseña de al menos 8 caracteres.");
    setOcupado(true);
    const sb = supabase()!;
    const { data, error } =
      modo === "entrar"
        ? await sb.auth.signInWithPassword({ email, password: clave })
        : await sb.auth.signUp({ email, password: clave });
    setOcupado(false);
    if (error) return toast.error(mensajeError(error.message));
    if (!data.session) return toast.error("La cuenta se ha creado pero falta confirmarla por correo.");
    setClave("");
    toast.success(modo === "crear" ? "¡Cuenta creada y sesión iniciada!" : "¡Sesión iniciada!");
  }

  if (!usuario) {
    return (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void acceder("entrar");
        }}
      >
        <p className="text-sm text-muted-foreground">
          Inicia sesión para guardar tus datos en la nube y usar la IA de la dieta. La primera vez, pulsa «Crear cuenta».
        </p>
        <Input type="email" required autoComplete="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" aria-label="Email" />
        <div className="relative">
          <Input
            type={verClave ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="h-12 rounded-xl pr-12"
            aria-label="Contraseña"
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" className="h-12 rounded-xl" disabled={ocupado}>
            <LogIn /> Entrar
          </Button>
          <Button type="button" variant="outline" className="h-12 rounded-xl" disabled={ocupado} onClick={() => acceder("crear")}>
            <UserPlus /> Crear cuenta
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
