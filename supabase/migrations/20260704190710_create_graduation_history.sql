-- Fase 6.1: `graduation_history` (seção 12 do NEXUSDOJO_PROJECT.md) +
-- trigger AFTER INSERT que atualiza `students.current_belt_id`/
-- `current_degree`/`last_graduation_date` automaticamente — garante que
-- o registro do histórico e a atualização da ficha do aluno aconteçam
-- na mesma transação (critério explícito da subtarefa), no mesmo padrão
-- já usado para gerar parcelas automaticamente ao criar um contrato
-- (Fase 5.5).

create table if not exists public.graduation_history (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  modality_id uuid not null references public.modalities (id) on delete restrict,
  previous_belt_id uuid references public.belts (id) on delete set null,
  previous_degree integer not null default 0,
  new_belt_id uuid not null references public.belts (id) on delete restrict,
  new_degree integer not null default 0,
  graduation_date date not null default current_date,
  registered_by_teacher_id uuid references public.teachers (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists graduation_history_school_id_idx on public.graduation_history (school_id);
create index if not exists graduation_history_student_id_idx on public.graduation_history (student_id);

create trigger graduation_history_set_updated_at
  before update on public.graduation_history
  for each row
  execute function public.set_updated_at();

alter table public.graduation_history enable row level security;

grant select, insert on public.graduation_history to authenticated;

create policy "users can select own school graduation_history"
  on public.graduation_history for select
  using (school_id = public.current_school_id());

create policy "users can insert own school graduation_history"
  on public.graduation_history for insert
  with check (school_id = public.current_school_id());

-- O trigger abaixo roda com o privilégio de quem executou o INSERT em
-- graduation_history (trigger comum, não SECURITY DEFINER) — a policy
-- de update de `students` (Fase 1.3) já cobre esse UPDATE normalmente,
-- desde que school_id bata.
create or replace function public.apply_student_graduation()
returns trigger
language plpgsql
as $$
begin
  update public.students
  set
    current_belt_id = new.new_belt_id,
    current_degree = new.new_degree,
    last_graduation_date = new.graduation_date
  where id = new.student_id
    and school_id = new.school_id;

  return new;
end;
$$;

create trigger graduation_history_apply_to_student
  after insert on public.graduation_history
  for each row
  execute function public.apply_student_graduation();
