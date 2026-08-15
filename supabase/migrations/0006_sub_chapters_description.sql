-- =====================================================================
-- 0006_sub_chapters_description.sql
-- REPAIR follow-up: the live sub_chapters table (older schema generation)
-- has no `description` column, which /api/hierarchy selects.
-- Adds it idempotently; preserves existing rows. Safe to re-run.
-- =====================================================================

alter table public.sub_chapters
  add column if not exists description text;