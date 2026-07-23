-- Fase 15.1: mensagens automáticas de aniversário (canal WhatsApp), baseado
-- em melhorias/Especificacoes_GB_Bandeirante.txt (seção "FASE 15"). Duas
-- tabelas novas (configuração + log de envio) + um campo que faltava em
-- `teachers` para o job diário (Fase 15.3) conseguir identificar
-- aniversariantes também entre professores, não só alunos
-- (`students.birth_date` já existe desde a Fase 2.3/8.4; `teachers` nunca
-- teve equivalente).

alter table public.teachers
  add column if not exists birth_date date;

-- `birthday_message_settings`: uma linha por escola (singleton). `enabled`
-- nasce `false` — ninguém recebe mensagem até o admin configurar e ligar
-- explicitamente (Fase 15.2). `message_template` já nasce com o texto
-- padrão da especificação; as variáveis {Nome}/{Faixa}/{Academia}/
-- {Professor} são substituídas em texto puro pela aplicação (Fase
-- 15.2/15.3), não neste banco.
create table if not exists public.birthday_message_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  notify_students boolean not null default true,
  notify_teachers boolean not null default true,
  enabled boolean not null default false,
  message_template text not null default 'Olá {Nome}!

Hoje é um dia muito especial!

Toda nossa equipe deseja um feliz aniversário!

Que sua caminhada no Jiu-Jitsu continue sendo cheia de conquistas!

Parabéns!

Equipe Nexus Dojo.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id)
);

create trigger birthday_message_settings_set_updated_at
  before update on public.birthday_message_settings
  for each row
  execute function public.set_updated_at();

alter table public.birthday_message_settings enable row level security;

grant select, insert, update on public.birthday_message_settings to authenticated;

-- Escrita liberada por RLS para qualquer staff da escola; o admin-only
-- fica a cargo da aplicação (`requireRole("admin")`), mesmo padrão já
-- usado em `belt_graduation_requirements` (Fase 13.1) e
-- `medal_point_rules` (Fase 12.1/12.2) — diferença aqui é que não há
-- nenhum outro papel/aluno com motivo de ler esta configuração, então na
-- prática só a tela admin (15.2) a acessa.
create policy "staff can select own school birthday_message_settings"
  on public.birthday_message_settings for select
  using (school_id = public.current_school_id());

create policy "staff can insert own school birthday_message_settings"
  on public.birthday_message_settings for insert
  with check (school_id = public.current_school_id());

create policy "staff can update own school birthday_message_settings"
  on public.birthday_message_settings for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

-- `sent_birthday_messages`: log append-only de envio, escrito só pelo job
-- diário (Fase 15.3, roda com service_role — bypassa RLS, por isso não há
-- policy de insert para `authenticated`, mesmo padrão de `notifications`
-- da Fase 9.2). Unique constraint impede reenvio duplicado no mesmo dia
-- para a mesma pessoa; NULLs não colidem entre si no Postgres, então
-- alunos (teacher_id sempre null) e professores (student_id sempre null)
-- não interferem uns nos outros nessa constraint.
create table if not exists public.sent_birthday_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  recipient_type text not null check (recipient_type in ('aluno', 'professor')),
  student_id uuid references public.students (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete cascade,
  date date not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  check (
    (recipient_type = 'aluno' and student_id is not null and teacher_id is null)
    or
    (recipient_type = 'professor' and teacher_id is not null and student_id is null)
  ),
  unique (recipient_type, student_id, teacher_id, date)
);

create index if not exists sent_birthday_messages_school_id_idx
  on public.sent_birthday_messages (school_id);

alter table public.sent_birthday_messages enable row level security;

grant select on public.sent_birthday_messages to authenticated;

create policy "staff can select own school sent_birthday_messages"
  on public.sent_birthday_messages for select
  using (school_id = public.current_school_id());
