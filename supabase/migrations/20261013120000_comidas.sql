-- Módulo de dieta: permite sincronizar la colección "comidas".
alter table public.registros drop constraint if exists registros_coleccion_check;
alter table public.registros add constraint registros_coleccion_check check (
  coleccion in ('kv', 'workouts', 'absSessions', 'armExercises', 'armSessions', 'bodyweights', 'notas', 'comidas')
);
