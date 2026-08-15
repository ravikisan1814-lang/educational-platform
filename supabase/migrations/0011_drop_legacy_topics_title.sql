-- =====================================================================
-- 0011_drop_legacy_topics_title.sql
-- REPAIR follow-up: the live topics table still carried the legacy
-- `title` column (text NOT NULL) alongside the canonical `name` added
-- by 0005 — every new topics insert from the content importer failed
-- with `null value in column "title"` because the importer writes only
-- the canonical columns. The old values were backfilled into `name` in
-- 0005 and no application code selects `title` anymore, so the column
-- is dropped (guarded, idempotent).
-- =====================================================================

alter table public.topics drop column if exists title;