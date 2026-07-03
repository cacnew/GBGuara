-- Fase 1.3: tabela `users` (perfil de aplicação, separado de auth.users)
-- + policies reais de RLS para schools/units/users, que ficaram
-- documentadas como pendentes nas migrations anteriores porque
-- dependiam desta tabela existir.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'teacher')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_school_id_idx on public.users (school_id);

create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

alter table public.users enable row level security;

-- RLS por si só não concede acesso: também é preciso o GRANT de tabela
-- para o papel `authenticated` (o Postgres nega por padrão na ausência
-- de privilégio, antes mesmo de avaliar as policies). `anon` não recebe
-- grant nenhum aqui — visitante não autenticado não deve enxergar nada
-- destas tabelas.
grant select, insert, update, delete on public.users to authenticated;
grant select, update on public.schools to authenticated;
grant select, update on public.units to authenticated;

-- Função auxiliar (SECURITY DEFINER) para descobrir a escola do usuário
-- autenticado sem cair em recursão de RLS ao ser usada dentro das
-- próprias policies de `users` — padrão recomendado pela Supabase.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#avoiding-recursive-rls-policies
create or replace function public.current_school_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.users where auth_user_id = auth.uid() limit 1;
$$;

-- `users`: cada usuário só enxerga/gerencia usuários da própria escola.
-- A criação do primeiro admin de uma escola nova (onboarding, Fase 1.5)
-- acontece via service_role no servidor, que bypassa RLS por padrão no
-- Supabase — não depende dessas policies.
create policy "users can select own school users"
  on public.users for select
  using (school_id = public.current_school_id());

create policy "users can insert own school users"
  on public.users for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school users"
  on public.users for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "users can delete own school users"
  on public.users for delete
  using (school_id = public.current_school_id());

-- `schools`: só a própria escola do usuário.
create policy "users can select own school"
  on public.schools for select
  using (id = public.current_school_id());

create policy "users can update own school"
  on public.schools for update
  using (id = public.current_school_id())
  with check (id = public.current_school_id());

-- `units`: só as unidades da própria escola.
create policy "users can select own school units"
  on public.units for select
  using (school_id = public.current_school_id());

create policy "users can update own school units"
  on public.units for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
