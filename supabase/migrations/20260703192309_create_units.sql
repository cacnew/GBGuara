-- Fase 1.2: tabela `units` (unidades físicas da escola) + criação
-- automática da unidade default ao cadastrar uma `school`.
--
-- No MVP 1A não existe CRUD de unidades ainda (ver seção 10.2 do
-- NEXUSDOJO_PROJECT.md) — toda escola nasce com exatamente uma unidade.

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists units_school_id_idx on public.units (school_id);

create trigger units_set_updated_at
  before update on public.units
  for each row
  execute function public.set_updated_at();

alter table public.units enable row level security;

-- Mesma situação da migration de `schools`: sem policy para
-- anon/authenticated até `users` existir (Fase 1.3). Policy final
-- planejada:
--
--   create policy "users can select own school units"
--     on public.units for select
--     using (
--       school_id = (
--         select school_id from public.users
--         where auth_user_id = auth.uid()
--       )
--     );

-- Criação automática da unidade default ao inserir uma escola.
create or replace function public.create_default_unit()
returns trigger
language plpgsql
as $$
begin
  insert into public.units (school_id, name)
  values (new.id, 'Unidade Principal');
  return new;
end;
$$;

create trigger schools_create_default_unit
  after insert on public.schools
  for each row
  execute function public.create_default_unit();
