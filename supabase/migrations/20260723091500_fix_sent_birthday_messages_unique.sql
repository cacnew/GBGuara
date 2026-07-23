-- Fase 15.1 (correção): a constraint `unique (recipient_type, student_id,
-- teacher_id, date)` criada em 20260723090000_create_birthday_messages.sql
-- não funciona na prática — em SQL/Postgres, NULL nunca é considerado
-- igual a NULL, então uma constraint composta com uma coluna NULL (aqui,
-- `teacher_id` é sempre NULL nas linhas de aluno, e `student_id` é sempre
-- NULL nas linhas de professor) nunca detecta duplicata nenhuma para
-- nenhuma das duas categorias — bug encontrado nesta sessão testando a
-- constraint manualmente antes de seguir para a 15.2. Correção padrão para
-- "unicidade sobre uma de duas colunas nullable": índice único sobre
-- `coalesce(student_id, teacher_id)`, que nunca é NULL (garantido pelo
-- check constraint já existente na tabela).
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.sent_birthday_messages'::regclass
    and contype = 'u';

  if cname is not null then
    execute format('alter table public.sent_birthday_messages drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists sent_birthday_messages_unique_recipient_date_idx
  on public.sent_birthday_messages (recipient_type, coalesce(student_id, teacher_id), date);
