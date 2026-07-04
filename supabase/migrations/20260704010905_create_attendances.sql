-- Fase 4.1: `attendances` (seção 10.14 do NEXUSDOJO_PROJECT.md).
--
-- Constraint obrigatória do documento mestre: o mesmo aluno não pode ser
-- registrado duas vezes na mesma sessão (unique(class_session_id,
-- student_id)) — é essa constraint que impede presença duplicada, não
-- lógica de aplicação.

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  registered_by_user_id uuid not null references public.users (id) on delete restrict,
  status text not null default 'presente'
    check (status in ('presente', 'falta', 'falta_justificada')),
  student_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_session_id, student_id)
);

create index if not exists attendances_school_id_idx on public.attendances (school_id);
create index if not exists attendances_student_id_idx on public.attendances (student_id);
create index if not exists attendances_class_session_id_idx on public.attendances (class_session_id);

create trigger attendances_set_updated_at
  before update on public.attendances
  for each row
  execute function public.set_updated_at();

alter table public.attendances enable row level security;

grant select, insert, update, delete on public.attendances to authenticated;

create policy "users can select own school attendances"
  on public.attendances for select
  using (school_id = public.current_school_id());

create policy "users can insert own school attendances"
  on public.attendances for insert
  with check (school_id = public.current_school_id());

create policy "users can delete own school attendances"
  on public.attendances for delete
  using (school_id = public.current_school_id());
