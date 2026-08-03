-- Fase 19.1: integração de pagamento online via gateway (Asaas). Estende
-- `installment_charges` (Fase 10.6, cobrança manual Pix/EMV) em vez de
-- criar uma tabela nova — a tela do aluno e a régua de cobrança (Fase 20)
-- já consultam essa tabela pra saber a cobrança mais recente de uma
-- parcela; duplicar o conceito em outra tabela exigiria as duas telas
-- fazendo join em duas fontes diferentes (decisão confirmada com o
-- usuário em 2026-08-03).
--
-- `gateway_status` fica NULL para cobranças do fluxo manual antigo
-- (charge_type = 'pix' sem Asaas) — só cobranças via gateway têm status
-- confirmável por webhook (Fase 19.3); `pix_payload` já existente passa a
-- ser preenchido também pelo texto copia-e-cola retornado pelo Asaas
-- quando `charge_type = 'pix'` via gateway (mesmo formato EMV, mesma
-- renderização de QR Code já existente, sem coluna nova pra isso).
-- `gateway_invoice_url` cobre boleto/cartão, que o Asaas expõe como link
-- de fatura, não como texto copia-e-cola.
--
-- `asaas_customer_id` fica por linha (não em `students`/`contracts`)
-- porque `contracts.financial_responsible_id` é polimórfico (aluno,
-- responsável ou "outro", sem FK) — não há uma única tabela dona do
-- "pagador" pra guardar isso hoje. Reaproveitar o customer_id de uma
-- cobrança anterior do mesmo responsável (evitar recriar cliente no
-- Asaas a cada cobrança) fica para a lógica de aplicação da Fase 19.2,
-- não é responsabilidade do schema.

alter table public.installment_charges
  drop constraint installment_charges_charge_type_check;

alter table public.installment_charges
  add constraint installment_charges_charge_type_check
  check (charge_type in ('pix', 'boleto', 'cartao'));

alter table public.installment_charges
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_charge_id text,
  add column if not exists gateway_status text
    check (gateway_status in ('pending', 'confirmed', 'overdue', 'refunded')),
  add column if not exists gateway_invoice_url text,
  add column if not exists raw_payload jsonb;

-- Único índice único parcial: várias linhas antigas (fluxo manual) têm
-- `asaas_charge_id` null, e null não conflita com null num índice único
-- comum — ainda assim o parcial deixa explícito que a unicidade só vale
-- pra cobranças de fato via gateway. Usado pelo webhook (Fase 19.3) pra
-- localizar a linha certa a partir do id de cobrança do Asaas.
create unique index if not exists installment_charges_asaas_charge_id_idx
  on public.installment_charges (asaas_charge_id)
  where asaas_charge_id is not null;

-- Sem alteração de RLS: as policies de select/insert já existentes em
-- `installment_charges` (Fase 10.6) são por linha, não por coluna —
-- colunas novas ficam automaticamente sujeitas às mesmas policies.
-- A escrita do webhook (Fase 19.3) roda via client de service_role
-- (bypassa RLS), mesmo padrão de `sent_birthday_messages`/jobs do
-- projeto — não precisa de policy de update para `authenticated`.
