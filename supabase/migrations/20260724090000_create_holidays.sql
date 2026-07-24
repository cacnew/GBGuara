-- Fase 16.1: tabela `holidays` (feriados/recessos) + seed automático dos
-- feriados nacionais fixos e móveis (Carnaval, Sexta-feira Santa, Corpus
-- Christi calculados via algoritmo de Páscoa — não cadastrados manualmente
-- ano a ano) do ano corrente e do próximo, para escolas já existentes e via
-- trigger para escolas novas — mesmo padrão de seed automático das Fases
-- 1/2/5/12.1.

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  date date not null,
  recurring boolean not null default true,
  has_class boolean not null default false,
  custom_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, date)
);

create index if not exists holidays_school_id_idx on public.holidays (school_id);

create trigger holidays_set_updated_at
  before update on public.holidays
  for each row
  execute function public.set_updated_at();

alter table public.holidays enable row level security;

grant select, insert, update, delete on public.holidays to authenticated;

create policy "staff can select own school holidays"
  on public.holidays for select
  using (school_id = public.current_school_id());

-- Aluno só lê (Fase 9.6/16.3 usam isso para avisar/bloquear dia sem aula).
create policy "student can select own school holidays"
  on public.holidays for select
  using (school_id = public.current_student_school_id());

create policy "staff can insert own school holidays"
  on public.holidays for insert
  with check (school_id = public.current_school_id());

create policy "staff can update own school holidays"
  on public.holidays for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "staff can delete own school holidays"
  on public.holidays for delete
  using (school_id = public.current_school_id());

-- Algoritmo de Meeus/Jones/Butcher (Gregoriano) para a data da Páscoa —
-- base de todas as datas móveis do calendário nacional.
create or replace function public.easter_date(p_year integer)
returns date
language plpgsql
immutable
as $$
declare
  a integer;
  b integer;
  c integer;
  d integer;
  e integer;
  f integer;
  g integer;
  h integer;
  i integer;
  k integer;
  l integer;
  m integer;
  v_month integer;
  v_day integer;
begin
  a := p_year % 19;
  b := p_year / 100;
  c := p_year % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  v_month := (h + l - 7 * m + 114) / 31;
  v_day := ((h + l - 7 * m + 114) % 31) + 1;
  return make_date(p_year, v_month, v_day);
end;
$$;

-- Insere o catálogo de feriados nacionais (fixos + móveis) de um ano para
-- uma escola. Idempotente via `on conflict` — pode ser chamada de novo sem
-- duplicar linhas.
create or replace function public.seed_national_holidays(p_school_id uuid, p_year integer)
returns void
language plpgsql
as $$
declare
  v_easter date := public.easter_date(p_year);
begin
  insert into public.holidays (school_id, name, date, recurring, has_class) values
    (p_school_id, 'Confraternização Universal', make_date(p_year, 1, 1), true, false),
    (p_school_id, 'Tiradentes', make_date(p_year, 4, 21), true, false),
    (p_school_id, 'Dia do Trabalho', make_date(p_year, 5, 1), true, false),
    (p_school_id, 'Independência do Brasil', make_date(p_year, 9, 7), true, false),
    (p_school_id, 'Nossa Senhora Aparecida', make_date(p_year, 10, 12), true, false),
    (p_school_id, 'Finados', make_date(p_year, 11, 2), true, false),
    (p_school_id, 'Proclamação da República', make_date(p_year, 11, 15), true, false),
    (p_school_id, 'Dia Nacional de Zumbi e da Consciência Negra', make_date(p_year, 11, 20), true, false),
    (p_school_id, 'Natal', make_date(p_year, 12, 25), true, false),
    (p_school_id, 'Carnaval', v_easter - 47, true, false),
    (p_school_id, 'Sexta-feira Santa', v_easter - 2, true, false),
    (p_school_id, 'Corpus Christi', v_easter + 60, true, false)
  on conflict (school_id, date) do nothing;
end;
$$;

create or replace function public.create_default_school_holidays()
returns trigger
language plpgsql
as $$
declare
  v_year integer := extract(year from now())::integer;
begin
  perform public.seed_national_holidays(new.id, v_year);
  perform public.seed_national_holidays(new.id, v_year + 1);
  return new;
end;
$$;

create trigger schools_create_default_holidays
  after insert on public.schools
  for each row
  execute function public.create_default_school_holidays();

-- Backfill para escolas já existentes (ano corrente + próximo).
do $$
declare
  v_school record;
  v_year integer := extract(year from now())::integer;
begin
  for v_school in select id from public.schools loop
    perform public.seed_national_holidays(v_school.id, v_year);
    perform public.seed_national_holidays(v_school.id, v_year + 1);
  end loop;
end;
$$;
