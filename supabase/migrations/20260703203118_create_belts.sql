-- Fase 2.2: `belt_systems` e `belts` (seção 10.9/10.10 do
-- NEXUSDOJO_PROJECT.md) + seed automático das faixas padrão de
-- jiu-jitsu (adulto e kids) ao criar uma escola.
--
-- O seed de faixas depende do id da modalidade "jiu_jitsu", criada pelo
-- trigger da Fase 2.1 (schools_create_default_modalities). Em vez de
-- depender da ordem de disparo entre dois triggers AFTER INSERT
-- separados na mesma tabela (frágil — Postgres dispara triggers em
-- ordem alfabética pelo nome, não pela ordem de criação), este migration
-- substitui o trigger da Fase 2.1 por um único trigger consolidado que
-- cria modalidades e faixas na ordem certa, dentro da mesma função.

create table if not exists public.belt_systems (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  modality_id uuid not null references public.modalities (id) on delete cascade,
  name text not null,
  audience text not null check (audience in ('adulto', 'kids', 'juvenil')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists belt_systems_school_id_idx on public.belt_systems (school_id);
create index if not exists belt_systems_modality_id_idx on public.belt_systems (modality_id);

create trigger belt_systems_set_updated_at
  before update on public.belt_systems
  for each row
  execute function public.set_updated_at();

create table if not exists public.belts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  belt_system_id uuid not null references public.belt_systems (id) on delete cascade,
  name text not null,
  color_hex text,
  ordering integer not null,
  max_degrees integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (belt_system_id, name),
  unique (belt_system_id, ordering)
);

create index if not exists belts_school_id_idx on public.belts (school_id);
create index if not exists belts_belt_system_id_idx on public.belts (belt_system_id);

create trigger belts_set_updated_at
  before update on public.belts
  for each row
  execute function public.set_updated_at();

alter table public.belt_systems enable row level security;
alter table public.belts enable row level security;

grant select, insert, update, delete on public.belt_systems to authenticated;
grant select, insert, update, delete on public.belts to authenticated;

create policy "users can select own school belt_systems"
  on public.belt_systems for select
  using (school_id = public.current_school_id());

create policy "users can insert own school belt_systems"
  on public.belt_systems for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school belt_systems"
  on public.belt_systems for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can select own school belts"
  on public.belts for select
  using (school_id = public.current_school_id());

create policy "users can insert own school belts"
  on public.belts for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school belts"
  on public.belts for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- Substitui o trigger/função da Fase 2.1: agora cria modalidades e, em
-- seguida, os sistemas de faixa + faixas padrão de jiu-jitsu, na mesma
-- transação e na ordem certa.
drop trigger if exists schools_create_default_modalities on public.schools;

create or replace function public.create_default_school_setup()
returns trigger
language plpgsql
as $$
declare
  v_jiu_jitsu_id uuid;
  v_belt_system_adulto_id uuid;
  v_belt_system_kids_id uuid;
begin
  insert into public.modalities (school_id, name, slug) values
    (new.id, 'Jiu-Jitsu', 'jiu_jitsu'),
    (new.id, 'No-Gi', 'no_gi'),
    (new.id, 'Muay Thai', 'muay_thai'),
    (new.id, 'Boxe', 'boxe'),
    (new.id, 'Defesa Pessoal', 'defesa_pessoal'),
    (new.id, 'Wrestling', 'wrestling'),
    (new.id, 'Funcional', 'funcional');

  select id into v_jiu_jitsu_id
  from public.modalities
  where school_id = new.id and slug = 'jiu_jitsu';

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Adulto', 'adulto')
  returning id into v_belt_system_adulto_id;

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Kids', 'kids')
  returning id into v_belt_system_kids_id;

  insert into public.belts (school_id, belt_system_id, name, color_hex, ordering, max_degrees) values
    (new.id, v_belt_system_adulto_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_adulto_id, 'Azul', '#2563EB', 2, 4),
    (new.id, v_belt_system_adulto_id, 'Roxa', '#7C3AED', 3, 4),
    (new.id, v_belt_system_adulto_id, 'Marrom', '#78350F', 4, 4),
    (new.id, v_belt_system_adulto_id, 'Preta', '#18181B', 5, 6),
    (new.id, v_belt_system_adulto_id, 'Coral', '#FF7F50', 6, 2),
    (new.id, v_belt_system_adulto_id, 'Vermelha', '#C8102E', 7, 0),
    (new.id, v_belt_system_kids_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_kids_id, 'Cinza', '#9CA3AF', 2, 4),
    (new.id, v_belt_system_kids_id, 'Amarela', '#FACC15', 3, 4),
    (new.id, v_belt_system_kids_id, 'Laranja', '#F97316', 4, 4),
    (new.id, v_belt_system_kids_id, 'Verde', '#16A34A', 5, 4);

  return new;
end;
$$;

create trigger schools_create_default_setup
  after insert on public.schools
  for each row
  execute function public.create_default_school_setup();
