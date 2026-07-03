-- Fase 2.1: tabela `modalities` (configurável por escola, não enum
-- hardcoded — seção 10.8 do NEXUSDOJO_PROJECT.md) + seed automático das
-- 7 modalidades padrão ao criar uma escola.

create table if not exists public.modalities (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  slug text not null,
  icon text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, slug)
);

create index if not exists modalities_school_id_idx on public.modalities (school_id);

create trigger modalities_set_updated_at
  before update on public.modalities
  for each row
  execute function public.set_updated_at();

alter table public.modalities enable row level security;

grant select, insert, update, delete on public.modalities to authenticated;
-- service_role já recebe GRANT automático via o ALTER DEFAULT PRIVILEGES
-- da Fase 1.8.

create policy "users can select own school modalities"
  on public.modalities for select
  using (school_id = public.current_school_id());

create policy "users can insert own school modalities"
  on public.modalities for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school modalities"
  on public.modalities for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- Seed automático das modalidades padrão ao criar uma escola nova.
create or replace function public.create_default_modalities()
returns trigger
language plpgsql
as $$
begin
  insert into public.modalities (school_id, name, slug) values
    (new.id, 'Jiu-Jitsu', 'jiu_jitsu'),
    (new.id, 'No-Gi', 'no_gi'),
    (new.id, 'Muay Thai', 'muay_thai'),
    (new.id, 'Boxe', 'boxe'),
    (new.id, 'Defesa Pessoal', 'defesa_pessoal'),
    (new.id, 'Wrestling', 'wrestling'),
    (new.id, 'Funcional', 'funcional');
  return new;
end;
$$;

create trigger schools_create_default_modalities
  after insert on public.schools
  for each row
  execute function public.create_default_modalities();
