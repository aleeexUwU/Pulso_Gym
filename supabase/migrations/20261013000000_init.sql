-- App de entrenamiento: almacén de sincronización por usuario.
-- La app es offline-first: cada dispositivo guarda en IndexedDB y sincroniza aquí.
-- Cada registro local (perfil, ajustes, plan, sesiones, abdominales, brazo izquierdo,
-- peso corporal, notas) es una fila con su colección, id y datos en JSON.

create table if not exists public.registros (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coleccion text not null check (
    coleccion in ('kv', 'workouts', 'absSessions', 'armExercises', 'armSessions', 'bodyweights', 'notas')
  ),
  id text not null,
  datos jsonb not null default '{}'::jsonb,
  -- Marca de tiempo del cliente (ms) para resolver conflictos: gana la más reciente.
  actualizado_en bigint not null,
  borrado boolean not null default false,
  -- Marca del servidor: cursor para descargar solo lo nuevo.
  modificado_servidor timestamptz not null default now(),
  primary key (user_id, coleccion, id)
);

create index if not exists registros_user_modificado_idx
  on public.registros (user_id, modificado_servidor);

-- El servidor fija modificado_servidor en cada escritura.
create or replace function public.registros_tocar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modificado_servidor := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists registros_tocar on public.registros;
create trigger registros_tocar
  before insert or update on public.registros
  for each row execute function public.registros_tocar();

-- No sobrescribir con datos más antiguos (dos dispositivos editando a la vez).
create or replace function public.registros_no_retroceder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.actualizado_en < old.actualizado_en then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists registros_no_retroceder on public.registros;
create trigger registros_no_retroceder
  before update on public.registros
  for each row execute function public.registros_no_retroceder();

-- Row Level Security: cada usuario solo ve y modifica sus propias filas.
alter table public.registros enable row level security;

drop policy if exists "registros_select_propios" on public.registros;
create policy "registros_select_propios" on public.registros
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "registros_insert_propios" on public.registros;
create policy "registros_insert_propios" on public.registros
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "registros_update_propios" on public.registros;
create policy "registros_update_propios" on public.registros
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "registros_delete_propios" on public.registros;
create policy "registros_delete_propios" on public.registros
  for delete to authenticated using ((select auth.uid()) = user_id);
