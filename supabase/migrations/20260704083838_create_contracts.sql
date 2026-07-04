-- Fase 5.4: `contracts` e `contract_students` (seções 11.4/11.5 do
-- NEXUSDOJO_PROJECT.md). Só schema nesta fase — o fluxo de criação
-- ("Associar plano ao aluno", com a regra "só um contrato ativo por
-- aluno") é implementado na Fase 5.6, quando existirem parcelas
-- (Fase 5.5) para criar tudo em uma única transação de verdade.
--
-- `financial_responsible_id` é polimórfico (aponta para students,
-- guardians ou "other", conforme `financial_responsible_type`) —
-- por isso não tem FK. A integridade desse campo é responsabilidade da
-- aplicação, não do banco.

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  financial_responsible_type text not null
    check (financial_responsible_type in ('student', 'guardian', 'other')),
  financial_responsible_id uuid,
  plan_id uuid not null references public.plans (id) on delete restrict,
  price_table_id uuid not null references public.price_tables (id) on delete restrict,
  start_date date not null,
  end_date date,
  status text not null default 'active'
    check (status in ('active', 'finished', 'canceled', 'paused', 'overdue')),
  original_price numeric(10, 2) not null,
  discount_type text not null default 'none'
    check (discount_type in ('none', 'fixed', 'percentage')),
  discount_value numeric(10, 2) not null default 0,
  final_price numeric(10, 2) not null,
  installments_count integer not null default 1 check (installments_count between 1 and 12),
  installment_amount numeric(10, 2) not null,
  first_due_date date not null,
  payment_day integer,
  setup_fee_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contracts_school_id_idx on public.contracts (school_id);
create index if not exists contracts_plan_id_idx on public.contracts (plan_id);

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row
  execute function public.set_updated_at();

create table if not exists public.contract_students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, student_id)
);

create index if not exists contract_students_contract_id_idx on public.contract_students (contract_id);
create index if not exists contract_students_student_id_idx on public.contract_students (student_id);

create trigger contract_students_set_updated_at
  before update on public.contract_students
  for each row
  execute function public.set_updated_at();

alter table public.contracts enable row level security;
alter table public.contract_students enable row level security;

grant select, insert, update, delete on public.contracts to authenticated;
grant select, insert, update, delete on public.contract_students to authenticated;

create policy "users can select own school contracts"
  on public.contracts for select
  using (school_id = public.current_school_id());

create policy "users can insert own school contracts"
  on public.contracts for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school contracts"
  on public.contracts for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can select own school contract_students"
  on public.contract_students for select
  using (school_id = public.current_school_id());

create policy "users can insert own school contract_students"
  on public.contract_students for insert
  with check (school_id = public.current_school_id());

-- Agora que `contracts` existe, a FK pendente desde a Fase 2.3 pode ser
-- criada.
alter table public.students
  add constraint students_current_contract_id_fkey
  foreign key (current_contract_id) references public.contracts (id) on delete set null;
