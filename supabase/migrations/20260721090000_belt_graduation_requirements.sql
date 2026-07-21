-- Fase 13.1: `belt_graduation_requirements` — meta configurável (pelo
-- admin) de nº de aulas para o aluno estar apto à próxima faixa,
-- incremento sobre a Fase 6.3 (que só mostra o contador de presenças
-- desde a última graduação, sem nenhuma meta para compará-lo). Uma linha
-- por transição de faixa (`from_belt_id` -> `to_belt_id`), consecutiva
-- pelo `ordering` já existente em `belts` (Fase 2.2) — a última faixa de
-- um `belt_system` não tem linha (não há "próxima faixa"). O sistema
-- nunca gradua automaticamente: esta tabela só alimenta o indicador de
-- aptidão (Fase 13.2/13.3), a decisão continua sendo do professor.

create table if not exists public.belt_graduation_requirements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  belt_system_id uuid not null references public.belt_systems (id) on delete cascade,
  from_belt_id uuid not null references public.belts (id) on delete cascade,
  to_belt_id uuid not null references public.belts (id) on delete cascade,
  required_classes integer not null default 0 check (required_classes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (belt_system_id, from_belt_id)
);

create index if not exists belt_graduation_requirements_school_id_idx
  on public.belt_graduation_requirements (school_id);

create trigger belt_graduation_requirements_set_updated_at
  before update on public.belt_graduation_requirements
  for each row
  execute function public.set_updated_at();

alter table public.belt_graduation_requirements enable row level security;

grant select, insert, update on public.belt_graduation_requirements to authenticated;

-- Leitura liberada para staff e aluno da mesma escola (mesmo padrão de
-- `medal_point_rules`, Fase 12.1): o aluno precisa da meta da própria
-- transição para o card "Sua evolução" (Fase 13.3).
create policy "school members can select belt_graduation_requirements"
  on public.belt_graduation_requirements for select
  using (
    school_id = coalesce(public.current_school_id(), public.current_student_school_id())
  );

-- Escrita liberada por RLS para qualquer staff da escola; o admin-only
-- fica a cargo da aplicação (`requireRole("admin")`), mesmo padrão já
-- usado em `medal_point_rules` (Fase 12.1/12.2).
create policy "staff can insert own school belt_graduation_requirements"
  on public.belt_graduation_requirements for insert
  with check (school_id = public.current_school_id());

create policy "staff can update own school belt_graduation_requirements"
  on public.belt_graduation_requirements for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
