-- Fase 9.4: quando o aluno sinaliza a própria presença, não há um usuário
-- staff (`public.users`) agindo — `registered_by_user_id` era NOT NULL,
-- assumindo que toda `attendance` nascia de uma ação de admin/professor.
-- Passa a ser opcional: NULL significa "sinalizado pelo próprio aluno"
-- (auditável via `signaled_at` + `student_id`, sem precisar de um ator
-- staff fictício). Não afeta nenhuma linha existente (todas já são
-- not null hoje).
alter table public.attendances
  alter column registered_by_user_id drop not null;

-- Aluno pode sinalizar (insert) e cancelar/re-sinalizar (update) a própria
-- presença — nunca se marcar como `confirmed`/`added_by_instructor`/
-- `no_show` (isso é exclusivo do professor, seção 3 da spec). Defesa em
-- profundidade: mesmo que o código da Server Action garanta isso, a RLS
-- também trava no banco.
create policy "students can insert own signaled attendance"
  on public.attendances for insert
  with check (
    student_id = public.current_student_id()
    and status = 'signaled'
  );

create policy "students can update own signaled or cancelled attendance"
  on public.attendances for update
  using (
    student_id = public.current_student_id()
    and status = 'signaled'
  )
  with check (
    student_id = public.current_student_id()
    and status in ('signaled', 'cancelled')
  );
