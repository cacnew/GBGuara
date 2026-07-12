-- Fase 9.5: fechar a chamada dispara notificações para os alunos
-- confirmados/incluídos manualmente. Quem cria essas notificações é o
-- professor/admin (staff), não o aluno — `public.notifications` só tinha
-- select/update liberado para `authenticated` (Fase 9.2). Adiciona insert
-- escopado por escola, no mesmo padrão de todas as outras tabelas de
-- staff (`current_school_id()`).
grant insert on public.notifications to authenticated;

create policy "staff can insert own school notifications"
  on public.notifications for insert
  with check (school_id = public.current_school_id());
