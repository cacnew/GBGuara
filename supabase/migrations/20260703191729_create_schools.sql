-- Fase 1.1: tabela `schools` (tenant raiz do NexusDojo) + RLS básica.

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função reutilizável para manter `updated_at` em dia em qualquer tabela
-- do projeto que tenha essa coluna (será reaproveitada nas próximas
-- migrations, não é exclusiva de `schools`).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_set_updated_at
  before update on public.schools
  for each row
  execute function public.set_updated_at();

alter table public.schools enable row level security;

-- Ainda não existe public.users (chega na migration da Fase 1.3), então
-- ainda não há como escrever uma policy real de "só vejo minha escola"
-- baseada em auth.uid(). Policy final planejada, a ser criada junto com
-- a migration de `users`:
--
--   create policy "users can select own school"
--     on public.schools for select
--     using (
--       id = (
--         select school_id from public.users
--         where auth_user_id = auth.uid()
--       )
--     );
--
-- Até lá, RLS está habilitada e sem nenhuma policy para os papéis `anon`
-- e `authenticated` — ou seja, acesso negado por padrão para esses
-- papéis. Apenas o `service_role` (bypassa RLS por padrão no Supabase)
-- consegue ler/escrever nesta tabela por enquanto.
