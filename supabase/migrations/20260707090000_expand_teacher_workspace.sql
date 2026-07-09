-- Expande o acesso operacional do professor sem expor financeiro/admin.

alter table public.class_sessions
  add column if not exists lesson_content text;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'attendances'
      and policyname = 'users can update own school attendances'
  ) then
    create policy "users can update own school attendances"
      on public.attendances for update
      using (school_id = public.current_school_id())
      with check (school_id = public.current_school_id());
  end if;
end $$;

create table if not exists public.graduation_suggestions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  suggested_by_teacher_id uuid references public.teachers (id) on delete set null,
  current_belt_id uuid references public.belts (id) on delete set null,
  suggested_belt_id uuid references public.belts (id) on delete set null,
  current_degree smallint,
  suggested_degree smallint not null default 0 check (suggested_degree between 0 and 4),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'canceled')),
  notes text,
  reviewed_by_user_id uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists graduation_suggestions_school_id_idx
  on public.graduation_suggestions (school_id);
create index if not exists graduation_suggestions_student_id_idx
  on public.graduation_suggestions (student_id);
create index if not exists graduation_suggestions_status_idx
  on public.graduation_suggestions (school_id, status);

create trigger graduation_suggestions_set_updated_at
  before update on public.graduation_suggestions
  for each row
  execute function public.set_updated_at();

alter table public.graduation_suggestions enable row level security;

grant select, insert, update on public.graduation_suggestions to authenticated;

create policy "users can select own school graduation_suggestions"
  on public.graduation_suggestions for select
  using (school_id = public.current_school_id());

create policy "users can insert own school graduation_suggestions"
  on public.graduation_suggestions for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school graduation_suggestions"
  on public.graduation_suggestions for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
