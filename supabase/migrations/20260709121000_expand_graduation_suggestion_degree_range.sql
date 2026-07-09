-- Permite que sugestoes de graduacao contemplem todas as graduacoes IBJJF,
-- incluindo faixas superiores que podem chegar ao 10o grau.
alter table public.graduation_suggestions
  drop constraint if exists graduation_suggestions_suggested_degree_check;

alter table public.graduation_suggestions
  add constraint graduation_suggestions_suggested_degree_check
  check (suggested_degree between 0 and 10);
