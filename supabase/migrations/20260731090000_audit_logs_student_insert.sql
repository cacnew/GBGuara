-- Fase 17.5: aluno passa a gravar em audit_logs ao criar um feedback ou
-- responder na própria thread (Fase 17.2). A policy de insert existente
-- (Fase 7.4) só cobre staff, via current_school_id() — que não resolve
-- para uma sessão de aluno. Aditiva, mesmo padrão de outras policies de
-- aluno já usadas no projeto (current_student_school_id()).
create policy "students can insert own school audit_logs"
  on public.audit_logs for insert
  with check (school_id = public.current_student_school_id());
