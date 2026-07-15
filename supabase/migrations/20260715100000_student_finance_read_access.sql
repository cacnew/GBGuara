-- Fase 10.5: área financeira do aluno (leitura própria).
--
-- `contracts`/`contract_students`/`contract_installments` já tinham select
-- para o aluno (Fase 9.1), mas faltavam duas peças para montar a mesma
-- visão que o admin já usa em `financial-queries.ts`: o nome do
-- plano/tabela de preço embutido no contrato (RLS de PostgREST também
-- filtra a tabela do embed) e a isenção financeira (usada para não marcar
-- aluno isento como inadimplente). Ambas dados de catálogo/próprio
-- registro, sem risco de vazar dados de outro aluno.

create policy "students can select own school plans"
  on public.plans for select
  using (school_id = public.current_student_school_id());

create policy "students can select own school price_tables"
  on public.price_tables for select
  using (school_id = public.current_student_school_id());

create policy "students can select own student_financial_exemptions"
  on public.student_financial_exemptions for select
  using (student_id = public.current_student_id());
