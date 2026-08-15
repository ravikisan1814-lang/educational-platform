-- =====================================================================
-- 0007_locked_payload_text.sql
-- REPAIR follow-up: the older live schema stored content_items.locked_payload
-- as `jsonb`; migration 0004 and the app reader expect `text` (raw HTML).
-- Converts the type while preserving JSON string values as raw text
-- (json objects fall back to their serialized text, best effort).
-- Idempotent: no-op when the column is already text. Safe to re-run.
-- =====================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_items'
      and column_name = 'locked_payload' and data_type in ('json', 'jsonb')
  ) then
    alter table public.content_items
      alter column locked_payload type text
      using case
        when locked_payload is null then ''
        when jsonb_typeof(locked_payload) = 'string' then locked_payload #>> '{}'
        else locked_payload::text
      end;
  end if;
end;
$$;

select data_type from information_schema.columns
where table_schema = 'public' and table_name = 'content_items'
  and column_name = 'locked_payload';