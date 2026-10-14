// Supabase Edge Function: recordatorios push. La llama pg_cron cada 15 minutos con la
// cabecera x-cron-secret. Para cada dispositivo suscrito, si ya ha pasado su hora (en
// su zona horaria) y hoy aún no se ha avisado, mira en los registros de esa persona qué
// le falta hoy (gimnasio y/o core) y le manda una notificación. Si no falta nada, no avisa.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VENTANA_MIN = 180; // si la app se suscribe tarde, no avisar pasadas 3 h de la hora elegida

interface Suscripcion {
  endpoint: string;
  user_id: string;
  p256dh: string;
  auth: string;
  zona_horaria: string;
  hora: string;
  ultimo_envio: string | null;
  aviso_proteina: boolean;
  proteina_objetivo: number | null;
  ultimo_aviso_proteina: string | null;
}

const HORA_PROTEINA = 18 * 60 + 30; // 18:30 locales

/** Fecha (AAAA-MM-DD), día de la semana (0 = domingo) y minutos del día en una zona horaria. */
function ahoraEn(zona: string): { fecha: string; dia: number; minutos: number } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    dia: dias.indexOf(partes.weekday),
    minutos: (Number(partes.hour) % 24) * 60 + Number(partes.minute),
  };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("No autorizado", { status: 401 });

  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: subs, error } = await sb.from("suscripciones_push").select("*").eq("activo", true);
  if (error) return new Response(error.message, { status: 500 });

  let enviados = 0;

  /** Envía un aviso. Devuelve false si la suscripción ya no existe (y la borra). */
  async function enviar(s: Suscripcion, aviso: { titulo: string; cuerpo: string; url: string }): Promise<boolean> {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso), { TTL: 3 * 3600 });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await sb.from("suscripciones_push").delete().eq("endpoint", s.endpoint);
        return false;
      }
    }
    return true;
  }
  for (const s of (subs ?? []) as Suscripcion[]) {
    const ahora = ahoraEn(s.zona_horaria || "Europe/Madrid");
    const [h, m] = s.hora.split(":").map(Number);
    const desde = h * 60 + m;

    // Aviso de proteína (opcional, máx. 1 al día): solo si hoy ya ha apuntado comida y lleva
    // menos de la mitad de su objetivo.
    if (
      s.aviso_proteina &&
      s.proteina_objetivo &&
      s.ultimo_aviso_proteina !== ahora.fecha &&
      ahora.minutos >= HORA_PROTEINA &&
      ahora.minutos <= HORA_PROTEINA + 90
    ) {
      const { data: comidas } = await sb
        .from("registros")
        .select("datos,borrado")
        .eq("user_id", s.user_id)
        .eq("coleccion", "comidas")
        .eq("datos->>fecha", ahora.fecha);
      const vivas = (comidas ?? []).filter((c) => !c.borrado);
      const proteina = vivas.reduce(
        (t, c) => t + ((c.datos?.items ?? []) as { proteinas?: number }[]).reduce((u, it) => u + (it.proteinas ?? 0), 0),
        0,
      );
      if (vivas.length > 0 && proteina < s.proteina_objetivo * 0.5) {
        const falta = Math.round(s.proteina_objetivo - proteina);
        await enviar(s, {
          titulo: "Vas corto de proteína",
          cuerpo: `Te faltan unos ${falta} g hoy. Un yogur proteico, atún o pollo en la cena te acercan.`,
          url: "/dieta/",
        });
      }
      await sb.from("suscripciones_push").update({ ultimo_aviso_proteina: ahora.fecha }).eq("endpoint", s.endpoint);
    }

    if (s.ultimo_envio === ahora.fecha || ahora.minutos < desde || ahora.minutos > desde + VENTANA_MIN) continue;

    // ¿Qué le falta hoy? Plan (kv "plan"), entrenos y core de hoy desde sus registros.
    const { data: filas } = await sb
      .from("registros")
      .select("coleccion,id,datos,borrado")
      .eq("user_id", s.user_id)
      .or(`and(coleccion.eq.kv,id.eq.plan),and(coleccion.in.(workouts,absSessions),datos->>fecha.eq.${ahora.fecha})`);
    const vivos = (filas ?? []).filter((f) => !f.borrado);
    const plan = vivos.find((f) => f.coleccion === "kv")?.datos?.valor as { dias?: { diaSemana: number; nombre: string }[] } | undefined;
    const diaGym = plan?.dias?.find((d) => d.diaSemana === ahora.dia);
    const gymHecho = vivos.some((f) => f.coleccion === "workouts" && f.datos?.estado === "completado");
    const coreHecho = vivos.some((f) => f.coleccion === "absSessions" && f.datos?.completado);

    let aviso: { titulo: string; cuerpo: string; url: string } | null = null;
    if (diaGym && !gymHecho) {
      aviso = {
        titulo: `Hoy toca ${diaGym.nombre.split(" · ")[0]}`,
        cuerpo: coreHecho ? "Tu rutina de gimnasio te espera." : "Gimnasio y, al volver, 10–15 min de core.",
        url: "/",
      };
    } else if (!coreHecho) {
      aviso = { titulo: "Core en casa", cuerpo: "Te faltan 10–15 minutos de core para cerrar el día.", url: "/abdominales/" };
    }

    if (aviso && !(await enviar(s, aviso))) continue;
    await sb.from("suscripciones_push").update({ ultimo_envio: ahora.fecha }).eq("endpoint", s.endpoint);
  }
  return new Response(JSON.stringify({ revisadas: subs?.length ?? 0, enviados }), { headers: { "Content-Type": "application/json" } });
});
