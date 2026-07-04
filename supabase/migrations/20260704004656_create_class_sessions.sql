-- Fase 3.2: `class_sessions` (aula que efetivamente aconteceu/foi
-- aberta, seção 10.13) + view `todays_class_groups` que resolve quais
-- turmas estão previstas para hoje a partir de `week_days`.

create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_group_id uuid not null references public.class_groups (id) on delete cascade,
  date date not null default current_date,
  actual_teacher_id uuid references public.teachers (id) on delete set null,
  status text not null default 'agendada'
    check (status in ('agendada', 'realizada', 'cancelada', 'extra')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_group_id, date)
);

create index if not exists class_sessions_school_id_idx on public.class_sessions (school_id);
create index if not exists class_sessions_date_idx on public.class_sessions (school_id, date);

create trigger class_sessions_set_updated_at
  before update on public.class_sessions
  for each row
  execute function public.set_updated_at();

alter table public.class_sessions enable row level security;

grant select, insert, update, delete on public.class_sessions to authenticated;

create policy "users can select own school class_sessions"
  on public.class_sessions for select
  using (school_id = public.current_school_id());

create policy "users can insert own school class_sessions"
  on public.class_sessions for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school class_sessions"
  on public.class_sessions for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- View das turmas previstas para hoje, a partir de week_days.
-- `security_invoker = true` é essencial: sem isso, a view roda com o
-- privilégio do dono (postgres), que bypassa RLS, e vazaria turmas de
-- outras escolas para qualquer usuário autenticado.
create view public.todays_class_groups
with (security_invoker = true)
as
select cg.*
from public.class_groups cg
where cg.status = 'active'
  and extract(dow from current_date)::smallint = any(cg.week_days);

grant select on public.todays_class_groups to authenticated;
