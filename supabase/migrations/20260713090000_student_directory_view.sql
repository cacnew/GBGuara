-- Fase 9.9: "Minha Academia" (aluno) precisa listar OUTROS alunos da
-- escola (nome, foto, faixa) na aba "Alunos" — mas `students` guarda
-- dados sensíveis (CPF, telefone, endereço, notas médicas, etc.) que
-- NUNCA devem vazar para outro aluno. Em vez de abrir select geral na
-- tabela para aluno, criamos uma view só com as colunas seguras.
--
-- Sem `security_invoker`: roda com privilégio de dono, ignorando a RLS
-- restritiva de "aluno só vê a própria linha" — mas o WHERE já escopa
-- pela escola do próprio chamador (staff OU aluno, via os helpers
-- `current_school_id()`/`current_student_school_id()`), então nunca
-- expõe outra escola nem qualquer coluna sensível (só as listadas aqui).
create view public.student_directory
as
select
  s.id,
  s.school_id,
  s.name,
  s.photo_url,
  s.status,
  s.current_belt_id,
  s.current_degree
from public.students s
where s.status = 'ativo'
  and s.school_id = coalesce(public.current_school_id(), public.current_student_school_id());

grant select on public.student_directory to authenticated;
