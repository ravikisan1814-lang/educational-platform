-- =====================================================================
-- 0008_categories_educational_content.sql
-- REPAIR follow-up: the live DB (older schema generation) has NO
-- `categories` table and educational_content lacks `category_id` /
-- `updated_at` / FK, so /api/contents cannot resolve the join and has
-- been serving demo fallback data.
--
-- Restores the canonical 0001/0002/0003 definitions idempotently:
--   * categories table + RLS policies + grants + 8 standard seeds
--   * educational_content.category_id / updated_at + FK + index
--   * educational_content RLS policies + exact column grants (the
--     file_url column remains authenticated-only)
-- Preserves existing rows. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. categories (canonical 0001 definition, if missing)
-- ---------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists categories_select_all on public.categories;
drop policy if exists categories_insert_admin on public.categories;
drop policy if exists categories_update_admin on public.categories;
drop policy if exists categories_delete_admin on public.categories;

create policy categories_select_all on public.categories
for select using (true);
create policy categories_insert_admin on public.categories
for insert with check (public.current_access_level() = 1);
create policy categories_update_admin on public.categories
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy categories_delete_admin on public.categories
for delete using (public.current_access_level() = 1);

revoke all on public.categories from anon, authenticated;
grant select (id, slug, name, description, sort_order, created_at)
on public.categories to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. educational_content: missing columns + FK
-- ---------------------------------------------------------------------

alter table public.educational_content
  add column if not exists category_id uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'educational_content_category_id_fkey'
  ) then
    alter table public.educational_content
      add constraint educational_content_category_id_fkey
      foreign key (category_id) references public.categories (id) on delete cascade;
  end if;
end;
$$;

create index if not exists educational_content_category_id_idx
  on public.educational_content (category_id);

-- ---------------------------------------------------------------------
-- 3. educational_content: RLS policies + exact column grants
--    (payload-safety: file_url only for authenticated, tier-gated)
-- ---------------------------------------------------------------------

drop policy if exists educational_content_select_metadata on public.educational_content;
drop policy if exists educational_content_select_full_by_tier on public.educational_content;
drop policy if exists educational_content_insert_admin on public.educational_content;
drop policy if exists educational_content_update_admin on public.educational_content;
drop policy if exists educational_content_delete_admin on public.educational_content;

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

revoke all on public.educational_content from anon, authenticated;
grant select (id, category_id, title, description, access_level, owner_contact, created_at, updated_at)
on public.educational_content to anon, authenticated;
grant select (file_url)
on public.educational_content to authenticated;

-- ---------------------------------------------------------------------
-- 4. updated_at trigger for educational_content (canonical)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'educational_content_set_updated_at'
  ) then
    create trigger educational_content_set_updated_at
    before update on public.educational_content
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Seed the standard categories (canonical 0002)
-- ---------------------------------------------------------------------

insert into public.categories (slug, name, description, sort_order) values
  ('class-11',          'Class 11',          'Class 11 curriculum content',                      1),
  ('class-11-e',        'Class 11 (E)',      'Class 11 extended content (E)',                    2),
  ('class-11-more',     'Class 11 More',     'Class 11 supplementary content',                   3),
  ('class-12',          'Class 12',          'Class 12 curriculum content',                      4),
  ('class-12-e',        'Class 12 (E)',      'Class 12 extended content (E)',                    5),
  ('class-12-more',     'Class 12 More',     'Class 12 supplementary content',                   6),
  ('general-knowledge', 'General Knowledge', 'General knowledge and awareness material',         7),
  ('loksewa-knowledge', 'Loksewa Knowledge', 'Loksewa exam preparation material',                8)
on conflict (slug) do nothing;