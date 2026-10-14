"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Glass, SectionTitle } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase, supabaseConfigurado } from "@/lib/sync/supabase";

interface Usuario {
  email: string;
  creado_en: string;
  ultimo_acceso: string | null;
  con_ia: boolean;
}

/**
 * Administración (solo se ve si la cuenta está en public.administradores): quién puede
 * usar la IA. Las comprobaciones de verdad las hace la base de datos (RLS y funciones).
 */
export function AdminIA() {
  const [admin, setAdmin] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [extra, setExtra] = useState<string[]>([]);
  const [nuevo, setNuevo] = useState("");

  const cargar = useCallback(async () => {
    const sb = supabase();
    if (!sb) return;
    const { data: esAdmin } = await sb.rpc("es_admin");
    setAdmin(!!esAdmin);
    if (!esAdmin) return;
    const [{ data: us }, { data: aut }] = await Promise.all([
      sb.rpc("usuarios_registrados"),
      sb.from("ia_autorizados").select("email"),
    ]);
    const lista = (us ?? []) as Usuario[];
    setUsuarios(lista);
    // Autorizados que aún no se han registrado.
    const registrados = new Set(lista.map((u) => u.email));
    setExtra(((aut ?? []) as { email: string }[]).map((a) => a.email).filter((e) => !registrados.has(e)));
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    // onAuthStateChange avisa al suscribirse (INITIAL_SESSION) y en cada cambio de sesión.
    const { data } = supabase()!.auth.onAuthStateChange(() => void cargar());
    return () => data.subscription.unsubscribe();
  }, [cargar]);

  if (!admin) return null;

  async function cambiar(email: string, on: boolean) {
    const sb = supabase()!;
    const { error } = on
      ? await sb.from("ia_autorizados").upsert({ email: email.toLowerCase() })
      : await sb.from("ia_autorizados").delete().eq("email", email.toLowerCase());
    if (error) return toast.error(error.message);
    toast.success(on ? `IA activada para ${email}` : `IA quitada a ${email}`);
    void cargar();
  }

  const fecha = (s: string | null) => (s ? new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "nunca");

  return (
    <Glass className="space-y-3">
      <SectionTitle>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Administración
        </span>
      </SectionTitle>
      <p className="text-xs text-muted-foreground">Solo lo ves tú. Elige qué cuentas pueden usar la IA (dieta y adaptar rutina).</p>
      <ul className="divide-y divide-border">
        {usuarios.map((u) => (
          <li key={u.email} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{u.email}</span>
              <span className="block text-xs text-muted-foreground">
                Alta {fecha(u.creado_en)} · último acceso {fecha(u.ultimo_acceso)}
              </span>
            </span>
            <Switch checked={u.con_ia} onCheckedChange={(v) => cambiar(u.email, v)} aria-label={`IA para ${u.email}`} />
          </li>
        ))}
        {extra.map((e) => (
          <li key={e} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{e}</span>
              <span className="block text-xs text-muted-foreground">Autorizado, aún sin cuenta</span>
            </span>
            <Switch checked onCheckedChange={(v) => !v && cambiar(e, false)} aria-label={`IA para ${e}`} />
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!/^\S+@\S+\.\S+$/.test(nuevo)) return toast.error("Escribe un email válido.");
          void cambiar(nuevo, true);
          setNuevo("");
        }}
      >
        <Input type="email" value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="email@ejemplo.com" className="h-11 rounded-xl" aria-label="Email a autorizar" />
        <Button type="submit" variant="outline" className="h-11 rounded-xl">
          <Plus /> Autorizar
        </Button>
      </form>
    </Glass>
  );
}
