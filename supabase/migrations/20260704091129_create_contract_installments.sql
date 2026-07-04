-- Fase 5.5: `contract_installments` (seção 11.6) + geração automática
-- via trigger AFTER INSERT em `contracts` — ao criar um contrato, as
-- parcelas já nascem geradas, sem passo manual extra na Fase 5.6.
-- Ajuste de arredondamento: a última parcela absorve a diferença
-- (final_price - base*(n-1)), garantindo que a soma bate exatamente
-- com final_price mesmo quando a divisão não é exata.

create table if not exists public.contract_installments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  installment_number integer not null,
  reference_month date not null,
  due_date date not null,
  amount numeric(10, 2) not null,
  paid_amount numeric(10, 2) not null default 0,
  remaining_amount numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'partially_paid', 'overdue', 'canceled', 'refunded')),
  payment_date date,
  payment_method text
    check (payment_method in ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, installment_number)
);

create index if not exists contract_installments_school_id_idx on public.contract_installments (school_id);
create index if not exists contract_installments_contract_id_idx on public.contract_installments (contract_id);
create index if not exists contract_installments_due_date_idx on public.contract_installments (school_id, due_date);

create trigger contract_installments_set_updated_at
  before update on public.contract_installments
  for each row
  execute function public.set_updated_at();

alter table public.contract_installments enable row level security;

grant select, insert, update, delete on public.contract_installments to authenticated;

create policy "users can select own school contract_installments"
  on public.contract_installments for select
  using (school_id = public.current_school_id());

create policy "users can update own school contract_installments"
  on public.contract_installments for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- O trigger abaixo roda com o privilégio de quem executou o INSERT em
-- contracts (trigger comum, não SECURITY DEFINER) — por isso o INSERT
-- em contract_installments também precisa satisfazer RLS normalmente,
-- não só o GRANT de tabela.
grant insert on public.contract_installments to authenticated;

create policy "users can insert own school contract_installments"
  on public.contract_installments for insert
  with check (school_id = public.current_school_id());

create or replace function public.generate_contract_installments()
returns trigger
language plpgsql
as $$
declare
  v_base_amount numeric(10, 2);
  v_last_amount numeric(10, 2);
  v_due_date date;
  i integer;
begin
  v_base_amount := round(new.final_price / new.installments_count, 2);
  v_last_amount := new.final_price - (v_base_amount * (new.installments_count - 1));
  v_due_date := new.first_due_date;

  for i in 1..new.installments_count loop
    insert into public.contract_installments (
      school_id, contract_id, installment_number, reference_month,
      due_date, amount, remaining_amount, status
    ) values (
      new.school_id,
      new.id,
      i,
      date_trunc('month', v_due_date)::date,
      v_due_date,
      case when i = new.installments_count then v_last_amount else v_base_amount end,
      case when i = new.installments_count then v_last_amount else v_base_amount end,
      'pending'
    );

    v_due_date := (v_due_date + interval '1 month')::date;
  end loop;

  return new;
end;
$$;

create trigger contracts_generate_installments
  after insert on public.contracts
  for each row
  execute function public.generate_contract_installments();
