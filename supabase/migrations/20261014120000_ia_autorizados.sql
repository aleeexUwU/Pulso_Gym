-- Quién puede usar la IA (dieta y adaptación de la rutina). Solo se añade a mano
-- (panel de Supabase o SQL); la app solo puede leer si la cuenta propia está.
create table if not exists public.ia_autorizados (
  email text primary key check (email = lower(email)),
  nota text,
  creado_en timestamptz not null default now()
);

alter table public.ia_autorizados enable row level security;

drop policy if exists "ia_autorizados_ver_propio" on public.ia_autorizados;
create policy "ia_autorizados_ver_propio" on public.ia_autorizados
  for select to authenticated
  using (email = lower((select auth.jwt() ->> 'email')));
-- Sin políticas de insert/update/delete: nadie puede autorizarse desde la app.

insert into public.ia_autorizados (email, nota)
values ('alexossas17@gmail.com', 'Dueño de la app')
on conflict (email) do nothing;
