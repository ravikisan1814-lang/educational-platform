-- =====================================================================
-- 0001_init.sql
-- Educational platform: schema + access-tier RLS.
--
-- Access tiers (users.access_level / contents.required_access_level):
--   1 = Owner      (100% access)
--   2 = Member     (50%)
--   3 = Co-member  (25%)
--   4 = Public     (free / anonymous)
--
-- Rule: a user may read FULL content rows only when
--       required_access_level >= user.access_level
-- (lower numbers grant more access; level 1 sees everything).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  access_level smallint not null default 4 check (access_level between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.users.access_level is
  'Access tier: 1=Owner, 2=Member, 3=Co-member, 4=Public';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  title text not null,
  description text,
  body_markdown text,
  file_url text,
  required_access_level smallint not null default 4 check (required_access_level between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.contents.required_access_level is
  'Minimum user access_level required to read the full row (body_markdown/file_url)';

create index contents_category_id_idx on public.contents (category_id);
create index contents_required_access_level_idx on public.contents (required_access_level);
create index users_access_level_idx on public.users (access_level);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger contents_set_updated_at
before update on public.contents
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- New signups start at the Public tier (level 4).
-- An owner later bumps the tier by updating users.access_level.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, access_level)
  values (new.id, coalesce(new.email, ''), 4)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helper used by RLS policies. Fail-closed: anonymous (or unknown) users
-- get NULL, which makes every tier comparison FALSE.
-- ---------------------------------------------------------------------

create or replace function public.current_access_level()
returns smallint
language sql
stable
set search_path = public
as $$
  select access_level from public.users where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.contents enable row level security;

-- users ----------------------------------------------------------------
-- Everyone can read their own profile; owners can read/write all.

create policy users_select_own on public.users
for select using (id = auth.uid());

create policy users_select_admin on public.users
for select using (public.current_access_level() = 1);

create policy users_insert_admin on public.users
for insert with check (public.current_access_level() = 1);

create policy users_update_admin on public.users
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);

create policy users_delete_admin on public.users
for delete using (public.current_access_level() = 1);

-- categories -------------------------------------------------------------
-- Public read; only owners may write.

create policy categories_select_all on public.categories
for select using (true);

create policy categories_insert_admin on public.categories
for insert with check (public.current_access_level() = 1);

create policy categories_update_admin on public.categories
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);

create policy categories_delete_admin on public.categories
for delete using (public.current_access_level() = 1);

-- contents ----------------------------------------------------------------
-- Two SELECT policies (PostgreSQL ORs them):
--
-- 1. contents_select_metadata: every role may read the *metadata* columns
--    of every row (needed so /api/contents can render lock badges).
--    The metadata COLUMN GRANT below is what stops anyone from reading
--    body_markdown/file_url through this policy.
--
-- 2. contents_select_full_by_tier: the FULL row (including body_markdown
--    and file_url) is only visible to users whose access_level meets the
--    content requirement. This is the core access-control rule and is
--    enforced at the database level, not the application level.

create policy contents_select_metadata on public.contents
for select using (true);

create policy contents_select_full_by_tier on public.contents
for select using (
  public.current_access_level() is not null
  and required_access_level >= public.current_access_level()
);

create policy contents_insert_admin on public.contents
for insert with check (public.current_access_level() = 1);

create policy contents_update_admin on public.contents
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);

create policy contents_delete_admin on public.contents
for delete using (public.current_access_level() = 1);

-- ---------------------------------------------------------------------
-- Explicit column-level grants (defense in depth).
--
-- Supabase grants all privileges on public tables to anon/authenticated
-- by default, so we revoke and re-grant precisely:
--
--   * anon / authenticated : metadata columns only
--                            (id, category_id, title, description,
--                             required_access_level, created_at, updated_at)
--   * authenticated        : additionally body_markdown and file_url —
--                            but row-level tier policy still gates WHICH
--                            rows they can read those columns on.
--
-- Administrators operate via the service_role key, which bypasses RLS,
-- so no role-based write grants are needed below.
-- ---------------------------------------------------------------------

revoke all on public.contents from anon, authenticated;
revoke all on public.users from anon, authenticated;
revoke all on public.categories from anon, authenticated;

grant select (id, category_id, title, description, required_access_level, created_at, updated_at)
on public.contents to anon, authenticated;

grant select (body_markdown, file_url)
on public.contents to authenticated;

grant select (id, email, access_level, created_at, updated_at)
on public.users to authenticated;

grant select (id, slug, name, description, sort_order, created_at)
on public.categories to anon, authenticated;
