-- Fase 14.1: `weekly_positions` (Posição da Semana). Staff (admin/professor)
-- publica uma técnica semanal, visível para todos os alunos da escola.
-- Regra "somente uma posição ativa por vez" (ao publicar uma nova, a
-- anterior é desativada automaticamente) é garantida na aplicação, não por
-- constraint de banco — mesmo padrão já usado para regras de negócio que
-- dependem de decisão explícita do fluxo (ex: "apenas um contrato ativo por
-- aluno", Fase 5.4).

create table if not exists public.weekly_positions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  title text not null,
  description text not null,
  image_url text not null,
  youtube_url text,
  start_date date not null,
  end_date date,
  published boolean not null default false,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_positions_school_id_idx
  on public.weekly_positions (school_id);

create index if not exists weekly_positions_school_published_idx
  on public.weekly_positions (school_id, published);

create trigger weekly_positions_set_updated_at
  before update on public.weekly_positions
  for each row
  execute function public.set_updated_at();

alter table public.weekly_positions enable row level security;

grant select, insert, update on public.weekly_positions to authenticated;

-- Staff lê todas as posições da própria escola (rascunho, agendada,
-- publicada) para a tela de cadastro/listagem (Fase 14.2).
create policy "staff can select own school weekly_positions"
  on public.weekly_positions for select
  using (school_id = public.current_school_id());

-- Aluno só lê posições publicadas da própria escola (Fase 14.3) — vigência
-- por data fica a cargo da aplicação, não da RLS.
create policy "student can select published weekly_positions"
  on public.weekly_positions for select
  using (
    school_id = public.current_student_school_id()
    and published = true
  );

create policy "staff can insert own school weekly_positions"
  on public.weekly_positions for insert
  with check (school_id = public.current_school_id());

create policy "staff can update own school weekly_positions"
  on public.weekly_positions for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
