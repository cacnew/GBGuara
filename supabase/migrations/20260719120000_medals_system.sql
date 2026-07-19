-- Fase 12: Sistema de Medalhas e Ranking. Staff (admin/professor) cadastra
-- eventos (competições) num catálogo por escola, com pontuação por nível
-- default (`medal_point_rules`) opcionalmente sobrescrita por evento
-- (`medal_event_point_rules`). Aluno lança seu desempenho escolhendo um
-- evento existente; staff aprova/rejeita. Ranking anual soma pontos das
-- medalhas `approved` por ano civil (calculado sob demanda, sem tabela de
-- snapshot).

-- Catálogo de eventos (decisão 1 do preâmbulo da Fase 12).
create table if not exists public.medal_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  organization text,
  event_date date not null,
  modality_id uuid references public.modalities (id) on delete set null,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medal_events_school_id_idx on public.medal_events (school_id);
create index if not exists medal_events_event_date_idx on public.medal_events (school_id, event_date);

create trigger medal_events_set_updated_at
  before update on public.medal_events
  for each row
  execute function public.set_updated_at();

alter table public.medal_events enable row level security;

grant select, insert, update on public.medal_events to authenticated;

-- Leitura liberada para todo autenticado da escola (staff OU aluno, via
-- `current_school_id()`/`current_student_school_id()`) — aluno precisa ver
-- o catálogo para escolher o evento ao lançar seu desempenho (12.4).
create policy "school members can select medal_events"
  on public.medal_events for select
  using (
    school_id = coalesce(public.current_school_id(), public.current_student_school_id())
  );

create policy "staff can insert own school medal_events"
  on public.medal_events for insert
  with check (school_id = public.current_school_id());

create policy "staff can update own school medal_events"
  on public.medal_events for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- Override de pontuação por evento (decisão 5): opcional, nível sem linha
-- aqui usa o default da escola em `medal_point_rules`.
create table if not exists public.medal_event_point_rules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.medal_events (id) on delete cascade,
  level text not null check (level in ('ouro', 'prata', 'bronze', 'participacao')),
  points integer not null check (points >= 0),
  unique (event_id, level)
);

create index if not exists medal_event_point_rules_event_id_idx
  on public.medal_event_point_rules (event_id);

alter table public.medal_event_point_rules enable row level security;

grant select, insert, update, delete on public.medal_event_point_rules to authenticated;

create policy "school members can select medal_event_point_rules"
  on public.medal_event_point_rules for select
  using (
    exists (
      select 1 from public.medal_events e
      where e.id = medal_event_point_rules.event_id
        and e.school_id = coalesce(public.current_school_id(), public.current_student_school_id())
    )
  );

create policy "staff can insert own school medal_event_point_rules"
  on public.medal_event_point_rules for insert
  with check (
    exists (
      select 1 from public.medal_events e
      where e.id = medal_event_point_rules.event_id
        and e.school_id = public.current_school_id()
    )
  );

create policy "staff can update own school medal_event_point_rules"
  on public.medal_event_point_rules for update
  using (
    exists (
      select 1 from public.medal_events e
      where e.id = medal_event_point_rules.event_id
        and e.school_id = public.current_school_id()
    )
  )
  with check (
    exists (
      select 1 from public.medal_events e
      where e.id = medal_event_point_rules.event_id
        and e.school_id = public.current_school_id()
    )
  );

create policy "staff can delete own school medal_event_point_rules"
  on public.medal_event_point_rules for delete
  using (
    exists (
      select 1 from public.medal_events e
      where e.id = medal_event_point_rules.event_id
        and e.school_id = public.current_school_id()
    )
  );

-- Pontuação default por nível, por escola (decisão 4). Seed automático dos
-- 4 níveis ao criar uma escola nova (mesmo padrão de
-- `create_default_modalities`, Fase 2.1) + backfill abaixo para escolas já
-- existentes no ambiente compartilhado.
create table if not exists public.medal_point_rules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  level text not null check (level in ('ouro', 'prata', 'bronze', 'participacao')),
  points integer not null check (points >= 0),
  unique (school_id, level)
);

create index if not exists medal_point_rules_school_id_idx on public.medal_point_rules (school_id);

alter table public.medal_point_rules enable row level security;

grant select, update on public.medal_point_rules to authenticated;

create policy "school members can select medal_point_rules"
  on public.medal_point_rules for select
  using (
    school_id = coalesce(public.current_school_id(), public.current_student_school_id())
  );

create policy "admin can update own school medal_point_rules"
  on public.medal_point_rules for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create or replace function public.create_default_medal_point_rules()
returns trigger
language plpgsql
as $$
begin
  insert into public.medal_point_rules (school_id, level, points) values
    (new.id, 'ouro', 3),
    (new.id, 'prata', 2),
    (new.id, 'bronze', 1),
    (new.id, 'participacao', 0);
  return new;
end;
$$;

create trigger schools_create_default_medal_point_rules
  after insert on public.schools
  for each row
  execute function public.create_default_medal_point_rules();

insert into public.medal_point_rules (school_id, level, points)
select s.id, defaults.level, defaults.points
from public.schools s
cross join (
  values ('ouro', 3), ('prata', 2), ('bronze', 1), ('participacao', 0)
) as defaults (level, points)
on conflict (school_id, level) do nothing;

-- Lançamentos de medalha/participação (decisões 2, 3, 6, 8). `event_id` é
-- obrigatório — o aluno sempre escolhe um evento existente do catálogo,
-- nunca digita dados de evento livremente (decisão 1).
create table if not exists public.medals (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  event_id uuid not null references public.medal_events (id) on delete restrict,
  modality_id uuid references public.modalities (id) on delete set null,
  category text,
  level text not null check (level in ('ouro', 'prata', 'bronze', 'participacao')),
  proof_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by_student_id uuid references public.students (id) on delete set null,
  submitted_by_user_id uuid references public.users (id) on delete set null,
  reviewed_by_user_id uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medals_submitted_by_exactly_one check (
    (submitted_by_student_id is not null and submitted_by_user_id is null)
    or (submitted_by_student_id is null and submitted_by_user_id is not null)
  )
);

create index if not exists medals_school_id_idx on public.medals (school_id);
create index if not exists medals_student_id_idx on public.medals (student_id);
create index if not exists medals_event_id_idx on public.medals (event_id);
create index if not exists medals_status_idx on public.medals (school_id, status);

create trigger medals_set_updated_at
  before update on public.medals
  for each row
  execute function public.set_updated_at();

alter table public.medals enable row level security;

grant select, insert, update on public.medals to authenticated;

-- Aluno lê as próprias medalhas (qualquer status) + medalhas `approved` de
-- qualquer aluno da escola (decisão 9 — ranking mostra todos os alunos).
-- Staff lê todas as medalhas da própria escola.
create policy "school members can select medals"
  on public.medals for select
  using (
    school_id = public.current_school_id()
    or (
      school_id = public.current_student_school_id()
      and (student_id = public.current_student_id() or status = 'approved')
    )
  );

-- Aluno só insere lançamento para si mesmo, sempre `pending`, nunca
-- pré-aprovado (decisão 8 — só staff aprova).
create policy "student can insert own pending medals"
  on public.medals for insert
  with check (
    school_id = public.current_student_school_id()
    and student_id = public.current_student_id()
    and submitted_by_student_id = public.current_student_id()
    and submitted_by_user_id is null
    and status = 'pending'
    and reviewed_by_user_id is null
    and reviewed_at is null
  );

-- Staff insere em nome de qualquer aluno da própria escola — inclusive já
-- `approved` (decisão 8, subtarefa 12.6: lançamento de staff nasce
-- aprovado, autor = revisor).
create policy "staff can insert own school medals"
  on public.medals for insert
  with check (school_id = public.current_school_id());

-- Aluno só edita o próprio lançamento enquanto pending/rejected, e a
-- edição sempre volta o registro para `pending` sem preencher campos de
-- revisão — nunca pode se autoaprovar.
create policy "student can update own editable medals"
  on public.medals for update
  using (
    school_id = public.current_student_school_id()
    and student_id = public.current_student_id()
    and submitted_by_student_id = public.current_student_id()
    and status in ('pending', 'rejected')
  )
  with check (
    school_id = public.current_student_school_id()
    and student_id = public.current_student_id()
    and submitted_by_student_id = public.current_student_id()
    and status = 'pending'
    and reviewed_by_user_id is null
    and reviewed_at is null
  );

-- Staff é o único que pode aprovar/rejeitar (decisão 8) — livre para
-- atualizar qualquer medalha da própria escola.
create policy "staff can update own school medals"
  on public.medals for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
