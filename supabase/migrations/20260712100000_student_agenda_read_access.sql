-- Fase 9.6: a tela de Agenda do aluno precisa ler `class_groups`
-- (turmas), `class_sessions` (ocupação/chamada fechada), `teachers`
-- (instrutor) e `belts` (faixa mínima da turma) — nenhuma dessas tabelas
-- tinha policy de select para aluno até agora (só para staff, via
-- `current_school_id()`), então a agenda aparecia sempre vazia (RLS
-- bloqueando silenciosamente, sem erro visível). São dados de catálogo,
-- não sensíveis, então liberar leitura para qualquer aluno da mesma
-- escola é equivalente ao que já vale para admin/professor.

create or replace function public.current_student_school_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.students where auth_user_id = auth.uid() limit 1;
$$;

create policy "students can select own school class_groups"
  on public.class_groups for select
  using (school_id = public.current_student_school_id());

create policy "students can select own school class_sessions"
  on public.class_sessions for select
  using (school_id = public.current_student_school_id());

create policy "students can select own school teachers"
  on public.teachers for select
  using (school_id = public.current_student_school_id());

create policy "students can select own school belts"
  on public.belts for select
  using (school_id = public.current_student_school_id());
