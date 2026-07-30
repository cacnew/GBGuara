-- Fase 16.4: notificações de aviso de feriado (2 dias antes / 1 dia antes /
-- no dia), reaproveitando o mesmo job diário da Fase 15.3 (nova
-- responsabilidade dentro da mesma rota de cron, sem entrada nova em
-- `vercel.json`). Decisão confirmada com o usuário em 2026-07-30: sem tela
-- de configuração nova — o texto editável já existente em
-- `holidays.custom_message` (Fase 16.1/16.2) é reaproveitado como corpo do
-- aviso (variáveis {Nome}/{Data}/{NomeFeriado}/{Academia} substituídas nele
-- pela aplicação); quando um feriado não tem `custom_message`, a aplicação
-- usa um texto padrão fixo. Não há "enabled" global — o controle já existe
-- via `holidays.has_class = false` (Fase 16.1) e a presença do próprio
-- feriado cadastrado.
--
-- Diferente do aniversário (uma notificação por dia por pessoa, chave
-- `(recipient, date)`), um mesmo feriado dispara até 3 notificações
-- distintas para a mesma pessoa (2 dias antes, 1 dia antes, no dia) — por
-- isso a chave de unicidade aqui é `(recipient, holiday_date, offset_days)`,
-- não só a data de hoje. Índice único já criado sobre `coalesce` desde o
-- início (a Fase 15.1 precisou de uma migration de correção separada para
-- isso, `20260723091500_fix_sent_birthday_messages_unique.sql`, porque NULL
-- nunca é igual a NULL no Postgres).
create table if not exists public.sent_holiday_notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  recipient_type text not null check (recipient_type in ('aluno', 'professor')),
  student_id uuid references public.students (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete cascade,
  holiday_date date not null,
  offset_days integer not null check (offset_days in (0, 1, 2)),
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  check (
    (recipient_type = 'aluno' and student_id is not null and teacher_id is null)
    or
    (recipient_type = 'professor' and teacher_id is not null and student_id is null)
  )
);

create unique index if not exists sent_holiday_notifications_unique_idx
  on public.sent_holiday_notifications (recipient_type, coalesce(student_id, teacher_id), holiday_date, offset_days);

create index if not exists sent_holiday_notifications_school_id_idx
  on public.sent_holiday_notifications (school_id);

alter table public.sent_holiday_notifications enable row level security;

grant select on public.sent_holiday_notifications to authenticated;

-- Log append-only, escrito só pelo job diário (service_role, bypassa RLS) —
-- mesmo padrão de `sent_birthday_messages` (Fase 15.1): sem policy de
-- insert para `authenticated`.
create policy "staff can select own school sent_holiday_notifications"
  on public.sent_holiday_notifications for select
  using (school_id = public.current_school_id());
