-- Planos no NexusDojo representam compromisso financeiro de acesso livre,
-- nao pacote de aulas ou limite semanal. A frequencia e operacional e de
-- apoio a graduacao; ela nunca consome saldo do plano.

update public.plans
set
  unlimited = true,
  classes_per_week = null,
  classes_total = null;

alter table public.plans
  add constraint plans_no_class_limits
  check (
    unlimited = true
    and classes_per_week is null
    and classes_total is null
  );
