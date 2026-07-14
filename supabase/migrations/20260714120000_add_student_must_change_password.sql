-- Fase 10.1 (modules/modulo_aluno2.md, TAREFA 1): reset de senha do aluno
-- pelo admin. Flag opt-in, default false — não afeta alunos existentes.
-- Quando true, o aluno é obrigado a trocar a senha antes de acessar
-- qualquer outra rota do módulo do aluno (checado em app/(student)/layout.tsx).

alter table public.students
  add column if not exists must_change_password boolean not null default false;
