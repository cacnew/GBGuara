-- Fase 8.2: tabela `leads` (funil simples de captação) + conversão para
-- `students`, reaproveitando os dados do lead (nome/telefone/e-mail).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source text,
  status text not null default 'novo'
    check (status in ('novo', 'contatado', 'agendado', 'matriculado', 'perdido')),
  notes text,
  converted_student_id uuid references public.students (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_school_id_idx on public.leads (school_id);

create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

alter table public.leads enable row level security;

grant select, insert, update, delete on public.leads to authenticated;

create policy "users can select own school leads"
  on public.leads for select
  using (school_id = public.current_school_id());

create policy "users can insert own school leads"
  on public.leads for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school leads"
  on public.leads for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can delete own school leads"
  on public.leads for delete
  using (school_id = public.current_school_id());
