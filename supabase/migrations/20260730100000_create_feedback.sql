-- Fase 17.1: canal "Fale Conosco" (sugestões/elogios/reclamações/dúvidas)
-- entre aluno, professor e administração, baseado em
-- melhorias/Especificacoes_GB_Bandeirante.txt (seção "FASE 17"). Duas
-- tabelas: `feedback` (metadados + roteamento) e `feedback_messages`
-- (thread de mensagens em formato de chat, "Toda conversa deve permanecer
-- registrada" — por isso é append-only, sem policy de update/delete pra
-- nenhum papel). Arquiteturalmente mais próxima de
-- `student_internal_notes` (Fase 10.7, thread anexada a um registro) como
-- referência de convenção, não de código — é uma entidade nova.
--
-- Conforme a especificação bruta: "Independentemente da escolha:
-- Administrador SEMPRE recebe. Professor recebe somente quando
-- selecionado." — ou seja, `target` não afeta a visibilidade do admin (ele
-- sempre lê tudo da própria escola); só afeta se um professor específico
-- também tem acesso.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  type text not null check (type in ('sugestao', 'elogio', 'reclamacao', 'duvida')),
  title text not null,
  target text not null check (target in ('professor', 'administrador', 'ambos')),
  -- Sem seletor de professor na tela do aluno (Fase 17.2, ver
  -- especificação) — quando `target` inclui professor, a aplicação
  -- preenche `teacher_id` automaticamente com `students.main_teacher_id`.
  -- Nulo quando `target = 'administrador'`.
  teacher_id uuid references public.teachers (id) on delete set null,
  status text not null default 'recebida'
    check (status in ('recebida', 'em_analise', 'respondida', 'encerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target = 'administrador' or teacher_id is not null)
);

create index if not exists feedback_school_id_idx on public.feedback (school_id);
create index if not exists feedback_student_id_idx on public.feedback (student_id);
create index if not exists feedback_teacher_id_idx on public.feedback (teacher_id);

create trigger feedback_set_updated_at
  before update on public.feedback
  for each row
  execute function public.set_updated_at();

-- `feedback_messages`: uma linha por mensagem da conversa, incluindo a
-- primeira (mensagem inicial do aluno ao criar o feedback) — por isso
-- `feedback` não tem coluna de corpo/anexo próprio, só metadados de
-- roteamento; o conteúdo inteiro vive aqui.
create table if not exists public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  author_user_id uuid references public.users (id) on delete set null,
  author_student_id uuid references public.students (id) on delete set null,
  body text not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  check (
    (author_user_id is not null and author_student_id is null)
    or
    (author_user_id is null and author_student_id is not null)
  )
);

create index if not exists feedback_messages_feedback_id_idx
  on public.feedback_messages (feedback_id);

alter table public.feedback enable row level security;
alter table public.feedback_messages enable row level security;

grant select, insert, update on public.feedback to authenticated;
grant select, insert on public.feedback_messages to authenticated;

-- Helper (SECURITY DEFINER, mesmo padrão de `current_school_id()`/
-- `current_student_id()`): descobre se o usuário staff autenticado é
-- admin. Primeira vez que uma policy do projeto precisa diferenciar
-- admin de professor dentro do banco — até aqui, toda distinção
-- admin/professor era só na aplicação (`requireRole`), porque os dois
-- sempre enxergavam as mesmas linhas nas tabelas existentes.
create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select role = 'admin' from public.users where auth_user_id = auth.uid() limit 1;
$$;

-- Helper (SECURITY DEFINER): teacher_id do professor autenticado. Não há
-- vínculo direto entre `public.users` e `public.teachers` hoje — mesma
-- resolução por e-mail já usada ad-hoc em
-- `app/(teacher)/professor/queries.ts:getTeacherDashboardData`, promovida
-- aqui a helper de RLS porque a Fase 17 precisa desse escopo dentro do
-- banco, não só na aplicação.
create or replace function public.current_teacher_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select t.id
  from public.users u
  join public.teachers t on t.email = u.email and t.school_id = u.school_id
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

-- `feedback` — select/insert do aluno: só os próprios.
create policy "student can select own feedback"
  on public.feedback for select
  using (student_id = public.current_student_id());

create policy "student can insert own feedback"
  on public.feedback for insert
  with check (student_id = public.current_student_id());

-- `feedback` — admin: lê/responde (update de status) tudo da própria
-- escola, independente de `target`.
create policy "admin can select all school feedback"
  on public.feedback for select
  using (school_id = public.current_school_id() and public.current_user_is_admin());

create policy "admin can update all school feedback"
  on public.feedback for update
  using (school_id = public.current_school_id() and public.current_user_is_admin())
  with check (school_id = public.current_school_id() and public.current_user_is_admin());

-- `feedback` — professor: só quando é o destinatário (`target` inclui
-- professor E `teacher_id` bate).
create policy "teacher can select own targeted feedback"
  on public.feedback for select
  using (
    school_id = public.current_school_id()
    and target in ('professor', 'ambos')
    and teacher_id = public.current_teacher_id()
  );

create policy "teacher can update own targeted feedback"
  on public.feedback for update
  using (
    school_id = public.current_school_id()
    and target in ('professor', 'ambos')
    and teacher_id = public.current_teacher_id()
  )
  with check (
    school_id = public.current_school_id()
    and target in ('professor', 'ambos')
    and teacher_id = public.current_teacher_id()
  );

-- `feedback_messages` — select: qualquer papel que já enxerga o
-- `feedback` pai (via `exists`, reaproveita as policies acima em vez de
-- duplicar a lógica de acesso).
create policy "participants can select feedback_messages"
  on public.feedback_messages for select
  using (
    exists (
      select 1 from public.feedback f
      where f.id = feedback_messages.feedback_id
    )
  );

-- `feedback_messages` — insert do aluno: só na própria thread, com o
-- próprio id como autor.
create policy "student can insert own feedback_messages"
  on public.feedback_messages for insert
  with check (
    author_student_id = public.current_student_id()
    and exists (
      select 1 from public.feedback f
      where f.id = feedback_messages.feedback_id
        and f.student_id = public.current_student_id()
    )
  );

-- `feedback_messages` — insert do staff (admin ou professor destinatário):
-- só quando já tem acesso de leitura ao `feedback` pai (mesmo `exists` da
-- policy de select acima), com o próprio id como autor.
create policy "staff can insert own feedback_messages"
  on public.feedback_messages for insert
  with check (
    author_user_id = (select id from public.users where auth_user_id = auth.uid())
    and exists (
      select 1 from public.feedback f
      where f.id = feedback_messages.feedback_id
    )
  );
