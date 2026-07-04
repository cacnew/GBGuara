-- Fase 5.7: `financial_movements` (seção 11.7 do NEXUSDOJO_PROJECT.md) —
-- visão de caixa. A criação automática de um movimento `income` ao
-- registrar pagamento de parcela é implementada na Fase 5.8, junto com
-- a ação "Registrar pagamento" — esta migration só cria o schema.
--
-- `financial_account_id` não está no documento mestre (seção 11.7), mas
-- foi adicionado aqui: sem essa FK, a tabela `financial_accounts` (Fase
-- 5.3, criada exatamente para saber "onde o dinheiro entrou") nunca
-- seria referenciada por nenhuma outra tabela do sistema. Ver
-- `docs/DECISIONS.md` para o registro completo dessa decisão.

create table if not exists public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  contract_installment_id uuid references public.contract_installments (id) on delete set null,
  financial_account_id uuid not null references public.financial_accounts (id) on delete restrict,
  type text not null check (type in ('income', 'refund', 'adjustment')),
  amount numeric(10, 2) not null,
  movement_date date not null default current_date,
  payment_method text
    check (payment_method in ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  category text not null default 'outro'
    check (category in (
      'mensalidade', 'matricula', 'graduacao', 'seminario',
      'produto', 'aula_avulsa', 'campeonato', 'outro'
    )),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_movements_school_id_idx on public.financial_movements (school_id);
create index if not exists financial_movements_student_id_idx on public.financial_movements (student_id);
create index if not exists financial_movements_contract_id_idx on public.financial_movements (contract_id);
create index if not exists financial_movements_movement_date_idx on public.financial_movements (school_id, movement_date);

create trigger financial_movements_set_updated_at
  before update on public.financial_movements
  for each row
  execute function public.set_updated_at();

alter table public.financial_movements enable row level security;

grant select, insert, update, delete on public.financial_movements to authenticated;

create policy "users can select own school financial_movements"
  on public.financial_movements for select
  using (school_id = public.current_school_id());

create policy "users can insert own school financial_movements"
  on public.financial_movements for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school financial_movements"
  on public.financial_movements for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
