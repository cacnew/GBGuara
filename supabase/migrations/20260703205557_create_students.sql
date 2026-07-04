-- Fase 2.3: tabela `students` (seção 10.4 do NEXUSDOJO_PROJECT.md).
--
-- `main_teacher_id` e `current_contract_id` ainda não têm FK: as tabelas
-- `teachers` (Fase 2.5) e `contracts` (Fase 5) não existem ainda. As
-- constraints serão adicionadas via ALTER TABLE nas migrations dessas
-- fases, quando as tabelas existirem.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  unit_id uuid not null references public.units (id) on delete restrict,
  name text not null,
  birth_date date,
  cpf text,
  phone text,
  email text,
  photo_url text,
  address text,
  emergency_contact text,
  enrollment_date date not null default current_date,
  status text not null default 'ativo'
    check (status in ('ativo', 'inativo', 'pausado', 'cancelado', 'inadimplente')),
  main_teacher_id uuid,
  notes text,
  medical_notes text,
  medical_certificate_url text,
  medical_certificate_expires_at date,
  lgpd_consent_at timestamptz,
  current_belt_id uuid references public.belts (id) on delete set null,
  current_degree integer not null default 0,
  last_graduation_date date,
  current_contract_id uuid,
  financial_status text not null default 'regular'
    check (financial_status in ('regular', 'overdue', 'exempt', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_school_id_idx on public.students (school_id);
create index if not exists students_name_idx on public.students (school_id, name);

create trigger students_set_updated_at
  before update on public.students
  for each row
  execute function public.set_updated_at();

alter table public.students enable row level security;

grant select, insert, update, delete on public.students to authenticated;

create policy "users can select own school students"
  on public.students for select
  using (school_id = public.current_school_id());

create policy "users can insert own school students"
  on public.students for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school students"
  on public.students for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
