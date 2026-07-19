-- Bug encontrado ao rodar e2e/attendance-signal.spec.ts numa data futura
-- (segunda-feira ainda não tocada por nenhum staff): quando o aluno
-- sinaliza presença numa turma cuja `class_sessions` daquele dia ainda
-- não existe, `getOrCreateClassSession` (session-materialization.ts)
-- tenta materializá-la usando o client autenticado do próprio aluno —
-- mas só havia policy de insert para staff (`current_school_id()`,
-- migration 20260704004656), então a materialização por aluno sempre
-- falhava com "new row violates row-level security policy for table
-- class_sessions". No dia a dia isso ficava mascarado porque, na maioria
-- das vezes, algum staff já tinha aberto a tela de chamada do dia antes
-- do aluno sinalizar, materializando a sessão primeiro. `attendances` já
-- tinha a policy de insert equivalente para aluno desde a Fase 9.4
-- (20260711150000) — só faltou a mesma coisa em `class_sessions`.
create policy "students can insert own school class_sessions"
  on public.class_sessions for insert
  with check (school_id = public.current_student_school_id());
