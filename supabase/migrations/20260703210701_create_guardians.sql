-- Fase 2.4: `guardians` (responsáveis) e `student_guardians` (vínculo
-- N:N aluno/responsável, seções 10.5 e 10.6 do NEXUSDOJO_PROJECT.md).

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  document text,
  relationship text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guardians_school_id_idx on public.guardians (school_id);

create trigger guardians_set_updated_at
  before update on public.guardians
  for each row
  execute function public.set_updated_at();

create table if not exists public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  guardian_id uuid not null references public.guardians (id) on delete cascade,
  is_primary boolean not null default false,
  is_financial_responsible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, guardian_id)
);

create index if not exists student_guardians_student_id_idx on public.student_guardians (student_id);
create index if not exists student_guardians_guardian_id_idx on public.student_guardians (guardian_id);

create trigger student_guardians_set_updated_at
  before update on public.student_guardians
  for each row
  execute function public.set_updated_at();

alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;

grant select, insert, update, delete on public.guardians to authenticated;
grant select, insert, update, delete on public.student_guardians to authenticated;

create policy "users can select own school guardians"
  on public.guardians for select
  using (school_id = public.current_school_id());

create policy "users can insert own school guardians"
  on public.guardians for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school guardians"
  on public.guardians for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can delete own school guardians"
  on public.guardians for delete
  using (school_id = public.current_school_id());

create policy "users can select own school student_guardians"
  on public.student_guardians for select
  using (school_id = public.current_school_id());

create policy "users can insert own school student_guardians"
  on public.student_guardians for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school student_guardians"
  on public.student_guardians for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can delete own school student_guardians"
  on public.student_guardians for delete
  using (school_id = public.current_school_id());
