-- Fase 10.7: observações internas do aluno (dossiê) — visível apenas para
-- staff (admin/professor), nunca para o aluno. Tabela própria em vez de
-- coluna em `students` de propósito: RLS do Postgres é por linha, não por
-- coluna — o aluno já tem policy de select na própria linha de `students`
-- (Fase 9.1), então qualquer campo ali seria potencialmente exposto por
-- um select futuro. Uma tabela sem NENHUMA policy para aluno garante que
-- a informação nunca vaza, por construção (mesmo padrão defensivo já
-- usado em `student_financial_exemptions`).

create table if not exists public.student_internal_notes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  author_user_id uuid references public.users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists student_internal_notes_student_id_idx
  on public.student_internal_notes (student_id);
create index if not exists student_internal_notes_school_id_idx
  on public.student_internal_notes (school_id);

alter table public.student_internal_notes enable row level security;

grant select, insert on public.student_internal_notes to authenticated;

create policy "users can select own school student_internal_notes"
  on public.student_internal_notes for select
  using (school_id = public.current_school_id());

create policy "users can insert own school student_internal_notes"
  on public.student_internal_notes for insert
  with check (school_id = public.current_school_id());
