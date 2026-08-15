-- =====================================================================
-- 0010_remove_blanket_grants.sql
-- SECURITY REPAIR: the live DB was created with blanket table-level
-- grants (`grant all ... to anon, authenticated`), which override
-- column-level selectivity — locked_payload / file_url / body_markdown
-- were readable by anonymous users with the publishable key, and
-- .env.local even held a SECRET key in the ANON slot (rotated after this
-- migration). Revokes everything and re-grants exactly the canonical
-- column sets (0003/0004/0005 with REVOKE included).
-- Profiles has no `updated_at` in the live (older) schema — granted
-- conditionally.
-- =====================================================================

revoke all on public.exam_groups, public.subjects, public.chapters,
  public.sub_chapters, public.topics, public.content_items,
  public.educational_content, public.categories, public.profiles
from anon, authenticated;

grant select on public.exam_groups, public.subjects, public.chapters,
  public.sub_chapters, public.topics to anon, authenticated;

grant select (id, topic_id, title, access_level, owner_contact, public_teaser, created_at, updated_at)
  on public.content_items to anon, authenticated;

grant select (id, category_id, title, description, access_level, owner_contact, created_at, updated_at)
  on public.educational_content to anon, authenticated;
grant select (file_url, body_markdown)
  on public.educational_content to authenticated;

grant select (id, slug, name, description, sort_order, created_at)
  on public.categories to anon, authenticated;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'updated_at'
  ) then
    grant select (id, email, role, access_level, created_at, updated_at)
      on public.profiles to authenticated;
  else
    grant select (id, email, role, access_level, created_at)
      on public.profiles to authenticated;
  end if;
end;
$$;