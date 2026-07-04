-- Fase 5.14: `payment_adjustments` (seção 11.10 do NEXUSDOJO_PROJECT.md)
-- — modelagem mínima para renegociação futura, sem tela nesta fase
-- (documento mestre autoriza deixar só modelado no MVP 1A).

create table if not exists public.payment_adjustments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  contract_id uuid not null references public.contracts (id) on delete cascade,
  adjustment_type text not null
    check (adjustment_type in ('discount', 'surcharge', 'refund', 'renegotiation', 'correction')),
  amount numeric(10, 2) not null,
  reason text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payment_adjustments_school_id_idx on public.payment_adjustments (school_id);
create index if not exists payment_adjustments_contract_id_idx on public.payment_adjustments (contract_id);

alter table public.payment_adjustments enable row level security;

grant select, insert on public.payment_adjustments to authenticated;

create policy "users can select own school payment_adjustments"
  on public.payment_adjustments for select
  using (school_id = public.current_school_id());

create policy "users can insert own school payment_adjustments"
  on public.payment_adjustments for insert
  with check (school_id = public.current_school_id());
