-- =====================================================================
-- 0012_auth_approval.sql
-- Approval gate for new signups + owner-only admin user management.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Approval fields on profiles
-- ---------------------------------------------------------------------

alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.profiles add column if not exists reviewed_at timestamptz;

comment on column public.profiles.status is
  'Account approval status: pending | active | rejected | hold';
comment on column public.profiles.approved_at is
  'Timestamp when the account was approved.';
comment on column public.profiles.reviewed_by is
  'Owner (profile id) who reviewed this account.';
comment on column public.profiles.reviewed_at is
  'Timestamp when the account was reviewed.';

-- ---------------------------------------------------------------------
-- 2. New-user trigger: signups start as pending (tier 4 = Public)
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, access_level, status)
  values (new.id, coalesce(new.email, ''), 'member', 4, 'pending')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. current_access_level() helper (idempotent replace)
-- ---------------------------------------------------------------------

create or replace function public.current_access_level()
returns smallint
language sql
stable
set search_path = public
as $$
  select access_level from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 4. Admin user management RLS policies
--    Owner (access_level = 1) can list/update any profile.
-- ---------------------------------------------------------------------

create policy admin_users_select on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 1)
  );

create policy admin_users_update on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 1)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 1)
  );
