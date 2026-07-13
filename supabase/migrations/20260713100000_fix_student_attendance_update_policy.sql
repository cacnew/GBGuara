-- Fase 9.11 (testes de integração revelaram o bug): a policy de update do
-- aluno em `attendances` (Fase 9.4) só permitia mexer na linha quando o
-- status ATUAL já era 'signaled' — bloqueando silenciosamente a reativação
-- 'cancelled' -> 'signaled' que `signalAttendance` depende (aluno cancela e
-- depois sinaliza de novo na mesma sessão). Como RLS filtra linhas sem
-- gerar erro em UPDATE, isso fazia `signalAttendance` responder sucesso
-- sem realmente reativar nada.
--
-- Corrige alargando o `using` para aceitar a linha em qualquer um dos dois
-- estados que o aluno pode alternar livremente (signaled <-> cancelled);
-- o `with check` já estava certo e continua o mesmo.
alter policy "students can update own signaled or cancelled attendance"
  on public.attendances
  using (
    student_id = public.current_student_id()
    and status in ('signaled', 'cancelled')
  )
  with check (
    student_id = public.current_student_id()
    and status in ('signaled', 'cancelled')
  );
