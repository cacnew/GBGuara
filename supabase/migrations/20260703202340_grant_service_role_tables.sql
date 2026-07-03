-- Fase 1.8: `service_role` bypassa RLS por padrão no Supabase, mas — assim
-- como descobrimos com `authenticated` na Fase 1.3 — RLS bypassada não
-- significa GRANT de tabela automático. Sem o GRANT, um insert direto via
-- PostgREST com a service_role key (ex: admin.from("users").insert(...))
-- falha com "permission denied", mesmo a operação sendo legítima.
--
-- service_role é o papel usado só por código server-side confiável, então
-- faz sentido ele ter acesso total por padrão — diferente de
-- `authenticated`, que continua exigindo GRANT explícito tabela a tabela
-- (força pensar em RLS a cada tabela nova).

grant all on public.schools, public.units, public.users to service_role;

-- Qualquer tabela nova criada pelas próximas migrations (rodam como
-- `postgres`) já nasce com esse grant para service_role, sem precisar
-- repetir isso manualmente em cada migration futura.
alter default privileges in schema public grant all on tables to service_role;
