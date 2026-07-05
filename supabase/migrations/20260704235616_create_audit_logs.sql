-- Fase 7.4: `audit_logs` (seção 13 do NEXUSDOJO_PROJECT.md) — auditoria
-- mínima para ações sensíveis. Append-only: só select/insert.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_school_id_idx on public.audit_logs (school_id);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

alter table public.audit_logs enable row level security;

grant select, insert on public.audit_logs to authenticated;

create policy "users can select own school audit_logs"
  on public.audit_logs for select
  using (school_id = public.current_school_id());

create policy "users can insert own school audit_logs"
  on public.audit_logs for insert
  with check (school_id = public.current_school_id());
