-- Fase 3.1: `class_groups` (turmas/horários da grade, seção 10.12 do
-- NEXUSDOJO_PROJECT.md). `suggested_audience` é apenas orientativo — o
-- sistema nunca bloqueia aluno por não se encaixar no público sugerido
-- (seção 3 do documento mestre, conceito de "turma flexível").

create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete restrict,
  name text not null,
  modality_id uuid not null references public.modalities (id) on delete restrict,
  main_teacher_id uuid references public.teachers (id) on delete set null,
  week_days smallint[] not null default '{}',
  start_time time not null,
  end_time time not null,
  suggested_audience text
    check (suggested_audience in (
      'kids', 'juvenil', 'adulto', 'feminino', 'iniciante', 'avancado',
      'competicao', 'livre'
    )),
  suggested_student_limit integer,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_groups_school_id_idx on public.class_groups (school_id);

create trigger class_groups_set_updated_at
  before update on public.class_groups
  for each row
  execute function public.set_updated_at();

alter table public.class_groups enable row level security;

grant select, insert, update, delete on public.class_groups to authenticated;

create policy "users can select own school class_groups"
  on public.class_groups for select
  using (school_id = public.current_school_id());

create policy "users can insert own school class_groups"
  on public.class_groups for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school class_groups"
  on public.class_groups for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
