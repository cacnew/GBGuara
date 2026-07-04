-- Fase 5.1: `price_tables` (seção 11.2 do NEXUSDOJO_PROJECT.md).
-- Referência comercial — nunca usada para recalcular contrato já
-- assinado (seção 11, princípio central do financeiro).

create table if not exists public.price_tables (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  description text,
  valid_from date not null,
  valid_until date,
  status text not null default 'active' check (status in ('active', 'inactive', 'legacy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists price_tables_school_id_idx on public.price_tables (school_id);

create trigger price_tables_set_updated_at
  before update on public.price_tables
  for each row
  execute function public.set_updated_at();

alter table public.price_tables enable row level security;

grant select, insert, update, delete on public.price_tables to authenticated;

create policy "users can select own school price_tables"
  on public.price_tables for select
  using (school_id = public.current_school_id());

create policy "users can insert own school price_tables"
  on public.price_tables for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school price_tables"
  on public.price_tables for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
