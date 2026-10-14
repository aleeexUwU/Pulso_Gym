-- Aviso opcional de proteína (máx. 1 al día, a las 18:30 locales, solo si ese día se ha
-- registrado comida y se lleva menos de la mitad del objetivo).
alter table public.suscripciones_push
  add column if not exists aviso_proteina boolean not null default false,
  add column if not exists proteina_objetivo integer,
  add column if not exists ultimo_aviso_proteina date;
