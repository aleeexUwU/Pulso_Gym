-- Notificaciones push (Web Push): una fila por dispositivo suscrito.
create table if not exists public.suscripciones_push (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  zona_horaria text not null default 'Europe/Madrid',
  hora text not null default '20:00',
  activo boolean not null default true,
  ultimo_envio date,
  actualizado_en timestamptz not null default now()
);

alter table public.suscripciones_push enable row level security;

drop policy if exists "push_propias" on public.suscripciones_push;
create policy "push_propias" on public.suscripciones_push
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- El envío lo hace la función enviar-recordatorios cada 15 minutos (pg_cron + pg_net).
-- La tarea programada se crea aparte porque lleva el secreto CRON_SECRET:
--   select cron.schedule('recordatorios-push', '*/15 * * * *', $$ select net.http_post(
--     url := 'https://<ref>.supabase.co/functions/v1/enviar-recordatorios',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := '{}'::jsonb) $$);
create extension if not exists pg_cron;
create extension if not exists pg_net;
