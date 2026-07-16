-- Gestao da landing page institucional por escola.

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  identity jsonb not null default '{}'::jsonb,
  navigation jsonb not null default '[]'::jsonb,
  hero jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  about jsonb not null default '{}'::jsonb,
  campaign jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  footer jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_pages_school_unique unique (school_id)
);

create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row
  execute function public.set_updated_at();

alter table public.landing_pages enable row level security;

grant select, insert, update, delete on public.landing_pages to authenticated;
grant select on public.landing_pages to anon;

create policy "public can select published landing pages"
  on public.landing_pages for select
  using (status = 'published');

create policy "users can select own school landing page"
  on public.landing_pages for select
  using (school_id = public.current_school_id());

create policy "users can insert own school landing page"
  on public.landing_pages for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school landing page"
  on public.landing_pages for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create table if not exists public.landing_teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  display_name text not null,
  role_title text,
  belt_label text,
  photo_url text,
  specialties text[] not null default '{}',
  quote text,
  bio text,
  instagram_url text,
  ordering integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_teacher_profiles_unique_teacher unique (school_id, teacher_id)
);

create index if not exists landing_teacher_profiles_school_order_idx
  on public.landing_teacher_profiles (school_id, ordering);

create trigger landing_teacher_profiles_set_updated_at
  before update on public.landing_teacher_profiles
  for each row
  execute function public.set_updated_at();

alter table public.landing_teacher_profiles enable row level security;

grant select, insert, update, delete on public.landing_teacher_profiles to authenticated;
grant select on public.landing_teacher_profiles to anon;

create policy "public can select active landing teachers"
  on public.landing_teacher_profiles for select
  using (
    status = 'active'
    and exists (
      select 1 from public.landing_pages lp
      where lp.school_id = landing_teacher_profiles.school_id
        and lp.status = 'published'
    )
  );

create policy "users can select own school landing teachers"
  on public.landing_teacher_profiles for select
  using (school_id = public.current_school_id());

create policy "users can insert own school landing teachers"
  on public.landing_teacher_profiles for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school landing teachers"
  on public.landing_teacher_profiles for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create table if not exists public.landing_class_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_group_id uuid not null references public.class_groups (id) on delete cascade,
  label_override text,
  ordering integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_class_groups_unique unique (school_id, class_group_id)
);

create index if not exists landing_class_groups_school_order_idx
  on public.landing_class_groups (school_id, ordering);

create trigger landing_class_groups_set_updated_at
  before update on public.landing_class_groups
  for each row
  execute function public.set_updated_at();

alter table public.landing_class_groups enable row level security;

grant select, insert, update, delete on public.landing_class_groups to authenticated;
grant select on public.landing_class_groups to anon;

create policy "public can select active landing classes"
  on public.landing_class_groups for select
  using (
    status = 'active'
    and exists (
      select 1 from public.landing_pages lp
      where lp.school_id = landing_class_groups.school_id
        and lp.status = 'published'
    )
  );

create policy "users can select own school landing classes"
  on public.landing_class_groups for select
  using (school_id = public.current_school_id());

create policy "users can insert own school landing classes"
  on public.landing_class_groups for insert
  with check (school_id = public.current_school_id());

create policy "users can update own school landing classes"
  on public.landing_class_groups for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());
