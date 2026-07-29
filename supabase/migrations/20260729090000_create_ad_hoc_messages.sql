-- Fase 18.1: mensagens avulsas do admin (WhatsApp + e-mail), pedido novo do
-- usuario fora da ordem original de planejamento. Uma linha por canal
-- enviado (se o admin marcar WhatsApp + e-mail no mesmo disparo, gera 2
-- linhas), sem constraint de unicidade diaria (aqui pode reenviar quantas
-- vezes quiser, diferente de `sent_birthday_messages` da Fase 15.1).
--
-- Diferente de `sent_birthday_messages` (gravada so pelo job com
-- service_role), aqui quem grava e o proprio admin autenticado a partir da
-- tela (Fase 18.2) — por isso a policy de insert e liberada para
-- `authenticated` restrita a `school_id`, com o admin-only reforcado na
-- aplicacao via `requireRole("admin")`, mesmo padrao de
-- `birthday_message_settings` (Fase 15.1) e `modules/whatsapp/actions.ts`
-- (Fase 8.3).
create table if not exists public.ad_hoc_messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  created_by uuid not null references public.users (id),
  recipient_type text not null check (recipient_type in ('aluno', 'professor', 'lead', 'manual')),
  student_id uuid references public.students (id) on delete set null,
  teacher_id uuid references public.teachers (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  recipient_name text not null,
  phone text,
  email text,
  channel text not null check (channel in ('whatsapp', 'email')),
  message text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ad_hoc_messages_school_id_idx
  on public.ad_hoc_messages (school_id);

alter table public.ad_hoc_messages enable row level security;

grant select, insert on public.ad_hoc_messages to authenticated;

create policy "staff can select own school ad_hoc_messages"
  on public.ad_hoc_messages for select
  using (school_id = public.current_school_id());

create policy "staff can insert own school ad_hoc_messages"
  on public.ad_hoc_messages for insert
  with check (school_id = public.current_school_id());
