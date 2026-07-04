-- Fase 5.3: `financial_accounts` (seção 11.8) + seed de contas padrão.
--
-- Em vez de só colocar inserts fixos em supabase/seed.sql (que só roda
-- uma vez, no `db reset` local, e não afeta escolas reais criadas via
-- onboarding), o seed de contas padrão entra no mesmo trigger
-- consolidado das Fases 2.1/2.2 (`create_default_school_setup`) — assim
-- toda escola nova, local ou em produção, já nasce com contas
-- financeiras básicas para poder registrar pagamento desde o primeiro
-- dia.

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'pix', 'card', 'other')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_accounts_school_id_idx on public.financial_accounts (school_id);

create trigger financial_accounts_set_updated_at
  before update on public.financial_accounts
  for each row
  execute function public.set_updated_at();

alter table public.financial_accounts enable row level security;

grant select, insert, update, delete on public.financial_accounts to authenticated;

create policy "users can select own school financial_accounts"
  on public.financial_accounts for select
  using (school_id = public.current_school_id());

create policy "users can insert own school financial_accounts"
  on public.financial_accounts for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school financial_accounts"
  on public.financial_accounts for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- Substitui o trigger consolidado das Fases 2.1/2.2 para também criar
-- as contas financeiras padrão.
drop trigger if exists schools_create_default_setup on public.schools;

create or replace function public.create_default_school_setup()
returns trigger
language plpgsql
as $$
declare
  v_jiu_jitsu_id uuid;
  v_belt_system_adulto_id uuid;
  v_belt_system_kids_id uuid;
begin
  insert into public.modalities (school_id, name, slug) values
    (new.id, 'Jiu-Jitsu', 'jiu_jitsu'),
    (new.id, 'No-Gi', 'no_gi'),
    (new.id, 'Muay Thai', 'muay_thai'),
    (new.id, 'Boxe', 'boxe'),
    (new.id, 'Defesa Pessoal', 'defesa_pessoal'),
    (new.id, 'Wrestling', 'wrestling'),
    (new.id, 'Funcional', 'funcional');

  select id into v_jiu_jitsu_id
  from public.modalities
  where school_id = new.id and slug = 'jiu_jitsu';

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Adulto', 'adulto')
  returning id into v_belt_system_adulto_id;

  insert into public.belt_systems (school_id, modality_id, name, audience)
  values (new.id, v_jiu_jitsu_id, 'Jiu-Jitsu Kids', 'kids')
  returning id into v_belt_system_kids_id;

  insert into public.belts (school_id, belt_system_id, name, color_hex, ordering, max_degrees) values
    (new.id, v_belt_system_adulto_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_adulto_id, 'Azul', '#2563EB', 2, 4),
    (new.id, v_belt_system_adulto_id, 'Roxa', '#7C3AED', 3, 4),
    (new.id, v_belt_system_adulto_id, 'Marrom', '#78350F', 4, 4),
    (new.id, v_belt_system_adulto_id, 'Preta', '#18181B', 5, 6),
    (new.id, v_belt_system_adulto_id, 'Coral', '#FF7F50', 6, 2),
    (new.id, v_belt_system_adulto_id, 'Vermelha', '#C8102E', 7, 0),
    (new.id, v_belt_system_kids_id, 'Branca', '#F4F4F5', 1, 4),
    (new.id, v_belt_system_kids_id, 'Cinza', '#9CA3AF', 2, 4),
    (new.id, v_belt_system_kids_id, 'Amarela', '#FACC15', 3, 4),
    (new.id, v_belt_system_kids_id, 'Laranja', '#F97316', 4, 4),
    (new.id, v_belt_system_kids_id, 'Verde', '#16A34A', 5, 4);

  insert into public.financial_accounts (school_id, name, type) values
    (new.id, 'Caixa', 'cash'),
    (new.id, 'Conta Bancária', 'bank'),
    (new.id, 'Pix', 'pix'),
    (new.id, 'Cartão', 'card');

  return new;
end;
$$;

create trigger schools_create_default_setup
  after insert on public.schools
  for each row
  execute function public.create_default_school_setup();
