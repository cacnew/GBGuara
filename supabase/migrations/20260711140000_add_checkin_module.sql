-- Fase 9.2: schema do módulo de check-in do aluno (modules/modulo_aluno.md).
--
-- Todas as extensões abaixo são aditivas e opt-in: nenhuma coluna/valor
-- existente é removido ou renomeado, e nenhum comportamento atual muda
-- para quem não usar os campos novos (decisão tomada com o usuário antes
-- de iniciar a Fase 9, registrada no TASK.md).

-- `class_groups`: vigência + bloqueio opcional de capacidade/elegibilidade.
-- `suggested_audience`/`suggested_student_limit` continuam puramente
-- orientativos (conceito de "turma flexível", Fase 4) — os campos abaixo
-- só passam a valer quando a própria turma os preenche.
alter table public.class_groups
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists capacity integer,
  add column if not exists min_belt_id uuid references public.belts (id) on delete set null,
  add column if not exists min_degree integer,
  add column if not exists sex_restriction text
    check (sex_restriction in ('masculino', 'feminino'));

-- `students`: sexo/gênero, campo novo e opcional (dado sensível, mesmo
-- espírito do `lgpd_consent_at` já existente — sem exigência de
-- preenchimento).
alter table public.students
  add column if not exists sex text
    check (sex in ('masculino', 'feminino'));

-- `class_sessions`: marca quando o professor fechou a chamada (consolida
-- no_show e trava novas sinalizações/confirmações nessa sessão). Não mexe
-- no enum de `status` existente.
alter table public.class_sessions
  add column if not exists attendance_closed_at timestamptz;

-- `attendances`: amplia o modelo para o fluxo sinalizar → confirmar,
-- convivendo com o modelo de uma etapa só usado hoje (professor adiciona
-- direto, sempre `presente`). O fluxo atual continua funcionando sem
-- alteração de código — `modules/attendance/actions.ts` insere sem
-- informar os campos novos, e o valor default de `status` não muda.
alter table public.attendances
  drop constraint if exists attendances_status_check;

alter table public.attendances
  add constraint attendances_status_check
  check (
    status in (
      'presente', 'falta', 'falta_justificada',
      'signaled', 'confirmed', 'added_by_instructor', 'no_show', 'cancelled'
    )
  );

alter table public.attendances
  add column if not exists signaled_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.users (id) on delete set null;

-- `notifications`: feed do aluno (seção 2 da spec). Aluno só lê e marca
-- como lida — inserts são feitos por código server-side (service_role),
-- por isso não há policy de insert para `authenticated`.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_student_id_idx on public.notifications (student_id);
create index if not exists notifications_school_id_idx on public.notifications (school_id);

alter table public.notifications enable row level security;

grant select, update on public.notifications to authenticated;

create policy "students can select own notifications"
  on public.notifications for select
  using (student_id = public.current_student_id());

create policy "students can update own notifications"
  on public.notifications for update
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());
