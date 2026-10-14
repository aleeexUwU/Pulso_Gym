// Comprobación común de las funciones de IA: sesión iniciada y email en la tabla
// public.ia_autorizados (solo se añade a mano desde Supabase).
import { createClient } from "npm:@supabase/supabase-js@2";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function respuesta(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

/** Devuelve el email autorizado, o una Response de error lista para devolver. */
export async function usuarioAutorizado(req: Request): Promise<{ email: string } | Response> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: usuario } = await supabase.auth.getUser();
  const email = usuario.user?.email?.toLowerCase();
  if (!email) return respuesta({ error: "Inicia sesión para usar la IA." }, 401);
  // RLS: cada usuario solo ve su propia fila, si existe.
  const { data, error } = await supabase.from("ia_autorizados").select("email").eq("email", email).maybeSingle();
  if (error) return respuesta({ error: "No se pudo comprobar el acceso a la IA." }, 500);
  if (!data) return respuesta({ error: "La IA no está activada para tu cuenta." }, 403);
  return { email };
}
