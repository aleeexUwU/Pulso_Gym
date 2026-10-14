-- Administradores de la app: pueden dar o quitar acceso a la IA desde la propia app.
create table if not exists public.administradores (
  email text primary key check (email = lower(email))
);
alter table public.administradores enable row level security;
-- Sin políticas: nadie lee ni escribe esta tabla desde la app; solo la usa es_admin().

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.administradores where email = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to authenticated;

-- Los administradores ven y gestionan toda la lista de autorizados.
drop policy if exists "ia_autorizados_admin" on public.ia_autorizados;
create policy "ia_autorizados_admin" on public.ia_autorizados
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Cuentas registradas (solo para administradores), con si tienen IA.
create or replace function public.usuarios_registrados()
returns table (email text, creado_en timestamptz, ultimo_acceso timestamptz, con_ia boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo para administradores' using errcode = '42501';
  end if;
  return query
    select lower(u.email)::text, u.created_at, u.last_sign_in_at,
           exists (select 1 from public.ia_autorizados a where a.email = lower(u.email))
    from auth.users u
    order by u.created_at;
end;
$$;
revoke all on function public.usuarios_registrados() from public;
grant execute on function public.usuarios_registrados() to authenticated;

insert into public.administradores (email) values ('alexossas17@gmail.com') on conflict do nothing;
