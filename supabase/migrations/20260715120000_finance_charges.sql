-- Fase 10.6: gestão de cobranças pelo admin (Pix copia-e-cola/QR Code
-- gerados localmente, sem gateway). `pix_key` fica na própria escola
-- (chave única usada em todas as cobranças); cada envio de cobrança por
-- parcela gera uma linha em `installment_charges` com o payload EMV já
-- montado (mesmo texto reaproveitado para o QR Code e para o "copia e
-- cola"). `charge_type` já prevê `boleto` para a "estrutura preparada"
-- pedida na subtarefa, mesmo sem integração real ainda.

alter table public.schools
  add column if not exists pix_key text;

create table if not exists public.installment_charges (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  contract_installment_id uuid not null references public.contract_installments (id) on delete cascade,
  charge_type text not null default 'pix' check (charge_type in ('pix', 'boleto')),
  pix_key text,
  pix_payload text,
  amount numeric(10, 2) not null,
  sent_by uuid references public.users (id) on delete set null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists installment_charges_school_id_idx
  on public.installment_charges (school_id);
create index if not exists installment_charges_installment_id_idx
  on public.installment_charges (contract_installment_id);

alter table public.installment_charges enable row level security;

grant select, insert on public.installment_charges to authenticated;

create policy "users can select own school installment_charges"
  on public.installment_charges for select
  using (school_id = public.current_school_id());

create policy "users can insert own school installment_charges"
  on public.installment_charges for insert
  with check (school_id = public.current_school_id());

-- Aluno só lê as próprias cobranças (tela da Fase 10.5) — mesmo padrão
-- de "students can select own contract installments" (Fase 9.1).
create policy "students can select own installment_charges"
  on public.installment_charges for select
  using (
    exists (
      select 1
      from public.contract_installments ci
      join public.contract_students cs on cs.contract_id = ci.contract_id
      where ci.id = installment_charges.contract_installment_id
        and cs.student_id = public.current_student_id()
    )
  );
