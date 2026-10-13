import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sin variables de entorno la app funciona en modo local (solo IndexedDB). */
export const supabaseConfigurado = Boolean(URL && KEY);

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!supabaseConfigurado || typeof window === "undefined") return null;
  if (!cliente) {
    cliente = createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    });
  }
  return cliente;
}
