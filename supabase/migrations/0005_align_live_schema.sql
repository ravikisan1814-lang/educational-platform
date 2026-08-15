-- =====================================================================
-- 0005_align_live_schema.sql
-- REPAIR migration: align the live database with migration 0004.
--
-- The live project was created from an older schema generation:
--   * hierarchy tables carry `order_index` instead of `sort_order`
--   * topics has `title` instead of `name` (titles preserved + backfilled)
--   * `updated_at`, `description`, the `get_content_item` RPC and the
--     `set_updated_at` maintenance function are missing.
--
-- This migration adds the missing pieces idempotently and preserves all
-- existing rows. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. set_updated_at maintenance function (defensive; exists in 0002+)
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Missing columns (sort_order / updated_at / name / description)
-- ---------------------------------------------------------------------

alter table public.exam_groups
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.subjects
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.chapters
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.sub_chapters
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.topics
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists name text,
  add column if not exists description text;

alter table public.content_items
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------
-- 3. Backfill topics.name from the existing title column (no data loss).
--    The repository schema treats `name` as canonical; `title` is kept.
-- ---------------------------------------------------------------------

update public.topics
set name = trim(title)
where name is null or name = '';

-- Ensure name is never null afterwards (new rows via sample seeds).
alter table public.topics
  alter column name set not null;

-- ---------------------------------------------------------------------
-- 4. Backfill sort_order from order_index where both exist
-- ---------------------------------------------------------------------

update public.chapters c set sort_order = c.order_index
where c.order_index is not null and c.sort_order = 0;
update public.sub_chapters sc set sort_order = sc.order_index
where sc.order_index is not null and sc.sort_order = 0;
update public.topics t set sort_order = t.order_index
where t.order_index is not null and t.sort_order = 0;

-- ---------------------------------------------------------------------
-- 5. Missing indexes / ordering support
-- ---------------------------------------------------------------------

create index if not exists subjects_exam_group_id_idx on public.subjects (exam_group_id);
create index if not exists chapters_subject_id_idx on public.chapters (subject_id);
create index if not exists sub_chapters_chapter_id_idx on public.sub_chapters (chapter_id);
create index if not exists topics_sub_chapter_id_idx on public.topics (sub_chapter_id);
create index if not exists content_items_topic_id_idx on public.content_items (topic_id);
create index if not exists content_items_access_level_idx on public.content_items (access_level);

-- ---------------------------------------------------------------------
-- 5b. Dedupe content_items before the unique constraint: the live DB has
--     archived duplicates of (topic_id, title). Keep per group the row
--     with the fullest locked_payload, then earliest created_at.
-- ---------------------------------------------------------------------

with ranked as (
  select id, row_number() over (
    partition by topic_id, title
    order by length(coalesce(locked_payload::text, '')) desc, created_at asc, id asc
  ) as rn
  from public.content_items
)
delete from public.content_items ci
using ranked
where ranked.id = ci.id and ranked.rn > 1;

-- ---------------------------------------------------------------------
-- 6. Unique constraints used by idempotent seeds (add if missing)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exam_groups_slug_key'
  ) then
    alter table public.exam_groups add constraint exam_groups_slug_key unique (slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'subjects_exam_group_id_slug_key'
  ) then
    alter table public.subjects add constraint subjects_exam_group_id_slug_key unique (exam_group_id, slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'chapters_subject_id_slug_key'
  ) then
    alter table public.chapters add constraint chapters_subject_id_slug_key unique (subject_id, slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'sub_chapters_chapter_id_slug_key'
  ) then
    alter table public.sub_chapters add constraint sub_chapters_chapter_id_slug_key unique (chapter_id, slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'topics_sub_chapter_id_slug_key'
  ) then
    alter table public.topics add constraint topics_sub_chapter_id_slug_key unique (sub_chapter_id, slug);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'content_items_topic_id_title_key'
  ) then
    alter table public.content_items add constraint content_items_topic_id_title_key unique (topic_id, title);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. updated_at triggers (add if missing)
-- ---------------------------------------------------------------------

do $$
declare
  v_name text;
begin
  foreach v_name in array array[
    'exam_groups_set_updated_at',
    'subjects_set_updated_at',
    'chapters_set_updated_at',
    'sub_chapters_set_updated_at',
    'topics_set_updated_at',
    'content_items_set_updated_at'
  ] loop
    if not exists (
      select 1 from pg_trigger where tgname = v_name
    ) then
      execute format(
        'create trigger %I before update on %I for each row execute function public.set_updated_at()',
        v_name, replace(v_name, '_set_updated_at', '')
      );
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. SECURITY DEFINER accessor for the locked payload (missing live).
--    Same definition as 0004 - single gate for locked_payload/variants,
--    tier re-checked inside SQL.
-- ---------------------------------------------------------------------

create or replace function public.get_content_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_item public.content_items%rowtype;
  v_level smallint;
  v_labels jsonb;
  v_extra jsonb;
  v_allowed boolean;
begin
  select * into v_item
  from public.content_items
  where id = p_item_id;

  if not found then
    return null;
  end if;

  v_level := public.current_access_level(); -- NULL for anon/unknown
  v_allowed := v_level is not null and v_item.access_level >= v_level;

  -- Type 1 is the canonical locked_payload; variants continue at Type 2+
  v_labels := jsonb_build_array('Type 1');
  if jsonb_typeof(v_item.variants) = 'array' and jsonb_array_length(v_item.variants) > 0 then
    select jsonb_agg(coalesce(elem ->> 'label', 'Type ' || (ord + 1)::text) order by ord)
    into v_extra
    from jsonb_array_elements(v_item.variants) with ordinality as t(elem, ord);
    v_labels := v_labels || v_extra;
  end if;

  return jsonb_build_object(
    'id', v_item.id,
    'topic_id', v_item.topic_id,
    'title', v_item.title,
    'access_level', v_item.access_level,
    'owner_contact', v_item.owner_contact,
    'public_teaser', v_item.public_teaser,
    'variant_labels', v_labels,
    'is_locked', not v_allowed,
    'locked_payload', case when v_allowed then v_item.locked_payload else null end,
    'variants', case when v_allowed then v_item.variants else null end
  );
end;
$$;

revoke all on function public.get_content_item(uuid) from public;
grant execute on function public.get_content_item(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Column visibility for the new columns.
--    Hierarchy tables are readable by everyone; content_items metadata
--    (id, topic_id, title, access_level, owner_contact, public_teaser,
--    timestamps) is readable, locked_payload / variants stay ungranted.
-- ---------------------------------------------------------------------

grant select on public.exam_groups, public.subjects, public.chapters,
  public.sub_chapters, public.topics to anon, authenticated;

-- Guarded so a partial re-run of this file can never error: only grant the
-- content_items metadata columns if the timestamps actually exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_items'
      and column_name in ('created_at', 'updated_at')
  ) then
    grant select (id, topic_id, title, access_level, owner_contact, public_teaser, created_at, updated_at)
    on public.content_items to anon, authenticated;
  end if;
end;
$$;