-- Fase 5.10: `student_financial_exemptions` (seção 11.9 do
-- NEXUSDOJO_PROJECT.md) — bolsistas, isentos, permutas ou cortesias.
-- Aluno com isenção `active` não deve aparecer como inadimplente (usado
-- pela view de inadimplência da Fase 5.11).
--
-- `reason` ganhou um check constraint (não estava explícito no
-- documento mestre, que só lista o campo) para manter consistência com
-- o padrão já usado em `category` de `financial_movements` — vocabulário
-- controlado em vez de texto livre.

create table if not exists public.student_financial_exemptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  reason text not null
    check (reason in ('bolsista', 'isento', 'permuta', 'cortesia', 'outro')),
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'ended', 'canceled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_financial_exemptions_school_id_idx
  on public.student_financial_exemptions (school_id);
create index if not exists student_financial_exemptions_student_id_idx
  on public.student_financial_exemptions (student_id);

create trigger student_financial_exemptions_set_updated_at
  before update on public.student_financial_exemptions
  for each row
  execute function public.set_updated_at();

alter table public.student_financial_exemptions enable row level security;

grant select, insert, update, delete on public.student_financial_exemptions to authenticated;

create policy "users can select own school student_financial_exemptions"
  on public.student_financial_exemptions for select
  using (school_id = public.current_school_id());

create policy "users can insert own school student_financial_exemptions"
  on public.student_financial_exemptions for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school student_financial_exemptions"
  on public.student_financial_exemptions for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
