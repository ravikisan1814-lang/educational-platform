-- =====================================================================
-- 0003_profiles_educational_content.sql
-- Refactor to the canonical schema (user-approved):
--   users              -> profiles           (+ role column)
--   contents           -> educational_content (+ owner_contact column,
--                                              required_access_level -> access_level)
--
-- RLS is recreated for the renamed tables with the same enforcement model:
--   * metadata (title/description/access_level/owner_contact) visible to all
--     (powers lock-badge lists and the "Contact with owner" action),
--   * raw content (file_url) only for users whose access_level >= content
--     access_level — Public (4) and anonymous users CANNOT query raw
--     Level 1/2/3 content.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Rename tables (idempotent guards; assumes 0001/0002 applied)
-- ---------------------------------------------------------------------

alter table if exists public.users rename to profiles;
alter table if exists public.contents rename to educational_content;

-- Drop the old policies on the (now renamed) tables — they will be
-- recreated below under the new naming scheme.
drop policy if exists users_select_own on public.profiles;
drop policy if exists users_select_admin on public.profiles;
drop policy if exists users_insert_admin on public.profiles;
drop policy if exists users_update_admin on public.profiles;
drop policy if exists users_delete_admin on public.profiles;

drop policy if exists contents_select_metadata on public.educational_content;
drop policy if exists contents_select_full_by_tier on public.educational_content;
drop policy if exists contents_insert_admin on public.educational_content;
drop policy if exists contents_update_admin on public.educational_content;
drop policy if exists contents_delete_admin on public.educational_content;

-- ---------------------------------------------------------------------
-- New columns
-- ---------------------------------------------------------------------

alter table public.profiles add column if not exists role text not null default 'member';

comment on column public.profiles.role is
  'Application role (e.g. member, owner). Distinct from the access_level tier.';

alter table public.educational_content add column if not exists owner_contact text;

comment on column public.educational_content.owner_contact is
  'How to contact the content owner (email/phone) for access requests. Publicly visible.';

alter table public.educational_content rename column required_access_level to access_level;

comment on column public.educational_content.access_level is
  'Minimum user access_level required to read the raw content (file_url): 1=Owner, 2=Member, 3=Co-member, 4=Public';

-- ---------------------------------------------------------------------
-- Indexes / triggers follow the renamed tables; tidy their names
-- ---------------------------------------------------------------------

alter index if exists public.users_access_level_idx rename to profiles_access_level_idx;
alter index if exists public.contents_category_id_idx rename to educational_content_category_id_idx;
alter index if exists public.contents_required_access_level_idx rename to educational_content_access_level_idx;

alter trigger if exists users_set_updated_at on public.profiles rename to profiles_set_updated_at;
alter trigger if exists contents_set_updated_at on public.educational_content rename to educational_content_set_updated_at;

-- ---------------------------------------------------------------------
-- Helpers re-pointed at profiles
-- ---------------------------------------------------------------------

create or replace function public.current_access_level()
returns smallint
language sql
stable
set search_path = public
as $$
  select access_level from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, access_level)
  values (new.id, coalesce(new.email, ''), 'member', 4)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles RLS
-- ---------------------------------------------------------------------

create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

create policy profiles_select_admin on public.profiles
for select using (public.current_access_level() = 1);

create policy profiles_insert_admin on public.profiles
for insert with check (public.current_access_level() = 1);

create policy profiles_update_admin on public.profiles
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);

create policy profiles_delete_admin on public.profiles
for delete using (public.current_access_level() = 1);

-- ---------------------------------------------------------------------
-- educational_content RLS
--
-- Two SELECT policies (PostgreSQL ORs them):
--   1. educational_content_select_metadata: everyone may read the metadata
--      columns of every row (lock badges + owner contact for requests).
--      The COLUMN GRANT below is what stops lower tiers from selecting
--      file_url through this policy.
--   2. educational_content_select_full_by_tier: the raw content column
--      (file_url) is only readable on rows where the user's access_level
--      meets the content's requirement. Public (4) users — and anonymous
--      users, whose current_access_level() is NULL — cannot read raw
--      Level 1/2/3 content.
-- ---------------------------------------------------------------------

create policy educational_content_select_metadata on public.educational_content
for select using (true);

create policy educational_content_select_full_by_tier on public.educational_content
for select using (
  public.current_access_level() is not null
  and access_level >= public.current_access_level()
);

create policy educational_content_insert_admin on public.educational_content
for insert with check (public.current_access_level() = 1);

create policy educational_content_update_admin on public.educational_content
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);

create policy educational_content_delete_admin on public.educational_content
for delete using (public.current_access_level() = 1);

-- ---------------------------------------------------------------------
-- Column-level grants (defense in depth)
-- ---------------------------------------------------------------------

revoke all on public.educational_content from anon, authenticated;
revoke all on public.profiles from anon, authenticated;

-- metadata + owner_contact: everyone (anon included)
grant select (id, category_id, title, description, access_level, owner_contact, created_at, updated_at)
on public.educational_content to anon, authenticated;

-- raw content pointer: authenticated users only — and the tier policy
-- above still decides WHICH rows they can read it on.
grant select (file_url)
on public.educational_content to authenticated;

grant select (id, email, role, access_level, created_at, updated_at)
on public.profiles to authenticated;
