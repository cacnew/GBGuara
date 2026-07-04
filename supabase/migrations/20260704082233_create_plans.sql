-- Fase 5.2: `plans` (seção 11.3 do NEXUSDOJO_PROJECT.md), sempre
-- vinculado a uma price_table.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  price_table_id uuid not null references public.price_tables (id) on delete cascade,
  name text not null,
  plan_duration text not null
    check (plan_duration in (
      'monthly', 'quarterly', 'semiannual', 'annual', 'drop_in',
      'package', 'trial'
    )),
  duration_months integer not null default 1,
  base_price numeric(10, 2) not null,
  classes_per_week integer,
  classes_total integer,
  unlimited boolean not null default true,
  setup_fee numeric(10, 2) not null default 0,
  loyalty_months integer not null default 0,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'legacy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_school_id_idx on public.plans (school_id);
create index if not exists plans_price_table_id_idx on public.plans (price_table_id);

create trigger plans_set_updated_at
  before update on public.plans
  for each row
  execute function public.set_updated_at();

alter table public.plans enable row level security;

grant select, insert, update, delete on public.plans to authenticated;

create policy "users can select own school plans"
  on public.plans for select
  using (school_id = public.current_school_id());

create policy "users can insert own school plans"
  on public.plans for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school plans"
  on public.plans for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
