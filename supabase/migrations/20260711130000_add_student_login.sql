-- Fase 9.1: login do aluno (modules/modulo_aluno.md).
--
-- `public.students` não tem relação com `auth.users` hoje — aluno é só um
-- registro de dados, gerenciado por admin/professor. Diferente de
-- `public.users` (admin/teacher, acesso escola inteira via
-- `current_school_id()`), o aluno só pode enxergar a própria linha, então
-- o vínculo de auth fica direto em `students` (não em `public.users`), com
-- um helper e policies próprios — análogo ao padrão de
-- `20260703192823_create_users.sql`, mas restrito a "é o próprio aluno",
-- não "é da mesma escola".

alter table public.students
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete cascade;

create or replace function public.current_student_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.students where auth_user_id = auth.uid() limit 1;
$$;

-- Policies adicionais de select para o aluno autenticado — somam às
-- policies de staff já existentes em cada tabela (Postgres combina
-- policies permissivas com OR), sem alterar nenhuma delas. Aluno só lê;
-- nenhuma policy de insert/update/delete é criada aqui.

create policy "students can select own row"
  on public.students for select
  using (id = public.current_student_id());

create policy "students can select own contract_students"
  on public.contract_students for select
  using (student_id = public.current_student_id());

create policy "students can select own contracts"
  on public.contracts for select
  using (
    exists (
      select 1 from public.contract_students cs
      where cs.contract_id = contracts.id
        and cs.student_id = public.current_student_id()
    )
  );

create policy "students can select own contract installments"
  on public.contract_installments for select
  using (
    exists (
      select 1 from public.contract_students cs
      where cs.contract_id = contract_installments.contract_id
        and cs.student_id = public.current_student_id()
    )
  );

create policy "students can select own attendances"
  on public.attendances for select
  using (student_id = public.current_student_id());

create policy "students can select own graduation history"
  on public.graduation_history for select
  using (student_id = public.current_student_id());

create policy "students can select own student_guardians"
  on public.student_guardians for select
  using (student_id = public.current_student_id());

create policy "students can select own guardians"
  on public.guardians for select
  using (
    exists (
      select 1 from public.student_guardians sg
      where sg.guardian_id = guardians.id
        and sg.student_id = public.current_student_id()
    )
  );
