-- Fase 2.6: `teacher_graduations` (seção 10.11 do NEXUSDOJO_PROJECT.md).
-- Sem tela dedicada de histórico ainda — só inserir/listar a partir da
-- ficha do professor (Fase 2.5).

create table if not exists public.teacher_graduations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  modality_id uuid not null references public.modalities (id) on delete restrict,
  belt_id uuid not null references public.belts (id) on delete restrict,
  degree integer not null default 0,
  since_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teacher_graduations_teacher_id_idx on public.teacher_graduations (teacher_id);
create index if not exists teacher_graduations_school_id_idx on public.teacher_graduations (school_id);

create trigger teacher_graduations_set_updated_at
  before update on public.teacher_graduations
  for each row
  execute function public.set_updated_at();

alter table public.teacher_graduations enable row level security;

grant select, insert, update, delete on public.teacher_graduations to authenticated;

create policy "users can select own school teacher_graduations"
  on public.teacher_graduations for select
  using (school_id = public.current_school_id());

create policy "users can insert own school teacher_graduations"
  on public.teacher_graduations for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school teacher_graduations"
  on public.teacher_graduations for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
