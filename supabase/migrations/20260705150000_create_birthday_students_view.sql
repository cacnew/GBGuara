-- Fase 8.4: view de aniversariantes do mês corrente, para a lista
-- reaproveitada na tela de aniversariantes.
--
-- `security_invoker = true` essencial (mesmo padrão de `todays_class_groups`
-- e `overdue_students`): sem isso a view roda com privilégio de dono e
-- vazaria aniversariantes de outras escolas.

create view public.birthday_students
with (security_invoker = true)
as
select
  s.id,
  s.school_id,
  s.name,
  s.phone,
  s.photo_url,
  s.birth_date,
  extract(day from s.birth_date)::int as birth_day
from public.students s
where s.status = 'ativo'
  and s.birth_date is not null
  and extract(month from s.birth_date) = extract(month from current_date);

grant select on public.birthday_students to authenticated;
