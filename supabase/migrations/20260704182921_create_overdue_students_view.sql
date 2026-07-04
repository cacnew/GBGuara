-- Fase 5.11: view que classifica aluno como inadimplente (`overdue`)
-- quando há parcela vencida e não paga, respeitando isenções ativas
-- (Fase 5.10). Usada pela tela de inadimplentes (Fase 5.13) e pelo
-- dashboard financeiro (Fase 7.1/7.3).
--
-- Implementada como view (não como job/rotina que grava `status =
-- 'overdue'` em `contract_installments`) — o critério da subtarefa
-- descreve explicitamente "query (view ou função)", e calcular em
-- leitura evita ter que manter um cron/scheduled function só para
-- marcar linhas como vencidas, e sempre reflete a data atual sem
-- depender de quando o job rodou pela última vez.
--
-- `security_invoker = true` é essencial (mesmo padrão da Fase 3.2,
-- `todays_class_groups`): sem isso, a view roda com privilégio de
-- dono e vazaria inadimplentes de outras escolas.

create view public.overdue_students
with (security_invoker = true)
as
select
  ci.school_id,
  cs.student_id,
  count(*)::int as overdue_installments_count,
  sum(ci.remaining_amount) as overdue_amount,
  min(ci.due_date) as oldest_overdue_due_date
from public.contract_installments ci
join public.contract_students cs on cs.contract_id = ci.contract_id
where ci.status in ('pending', 'partially_paid')
  and ci.due_date < current_date
  and not exists (
    select 1
    from public.student_financial_exemptions sfe
    where sfe.student_id = cs.student_id
      and sfe.status = 'active'
      and sfe.start_date <= current_date
      and (sfe.end_date is null or sfe.end_date >= current_date)
  )
group by ci.school_id, cs.student_id;

grant select on public.overdue_students to authenticated;
