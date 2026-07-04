-- Fase 2.5: tabela `teachers` (ficha do professor, seção 10.7 do
-- NEXUSDOJO_PROJECT.md) + FK de students.main_teacher_id, que ficou
-- pendente na migration da Fase 2.3 porque esta tabela ainda não existia.

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teachers_school_id_idx on public.teachers (school_id);

create trigger teachers_set_updated_at
  before update on public.teachers
  for each row
  execute function public.set_updated_at();

alter table public.teachers enable row level security;

grant select, insert, update, delete on public.teachers to authenticated;

create policy "users can select own school teachers"
  on public.teachers for select
  using (school_id = public.current_school_id());

create policy "users can insert own school teachers"
  on public.teachers for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school teachers"
  on public.teachers for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- FK pendente desde a Fase 2.3 (a tabela teachers não existia ainda).
alter table public.students
  add constraint students_main_teacher_id_fkey
  foreign key (main_teacher_id) references public.teachers (id) on delete set null;
