-- =====================================================================
-- 0005_notes_architecture_blocks.sql
-- Integrates the ravikishan notes architecture onto the existing
-- multi-tier hierarchy (exam_groups -> subjects -> chapters ->
-- sub_chapters -> topics -> content_items).
--
-- Adds to content_items:
--   * block_type    - the 8 tab types (concept, note, example, formula,
--                     pyq, set, mindmap, graph) -> mapped to the canonical
--                     BlockType ids in lib/access.ts during import.
--   * section_index - the canonical 11-section render order (0..10).
--   * note_type     - draft type (1/2/3...) for grouped concept versions.
--   * metadata      - jsonb: sourceKey, contentType, classifiedBy,
--                     classifiedConfidence, classifiedReason, order,
--                     contentHash, graph spec if present.
--
-- Adds to subjects (mirror of the ravikishan subject catalogue):
--   * subject_type  - science_math | biology | english | nepali |
--                     general_knowledge | computer_science
--   * icon          - orbit | flask | ruler | dna | book | pen | scale | globe
--   * theme_color   - e.g. '#38bdf8'
--   * is_locked     - catalogue lock metadata (public read, no payload)
--
-- SECURITY: block_type / section_index / note_type / metadata are PUBLIC
-- metadata (they drive the syllabus map and block-type styling). The 90%
-- payload stays behind get_content_item() as before. metadata may contain
-- a graph spec (mindmapJson/diagramData equivalent) which is part of the
-- locked payload tier, so we keep it OUT of metadata and instead store it
-- in the variants JSONB (interface 'graph') exactly like the existing model.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. content_items - block-type columns
-- ---------------------------------------------------------------------

alter table public.content_items
  add column if not exists block_type text,
  add column if not exists section_index integer,
  add column if not exists note_type integer not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object');

-- Topic-relative order within a section (sort_order already exists).
create index if not exists content_items_block_type_idx on public.content_items (block_type);
create index if not exists content_items_section_index_idx on public.content_items (section_index);

-- ---------------------------------------------------------------------
-- 2. subjects - catalogue metadata (mirror of ravikishan SUBJECTS)
-- ---------------------------------------------------------------------

alter table public.subjects
  add column if not exists subject_type text,
  add column if not exists icon text,
  add column if not exists theme_color text,
  add column if not exists is_locked boolean not null default true;

-- ---------------------------------------------------------------------
-- 3. Seed subject catalogue metadata (idempotent, matches migration 0004)
-- ---------------------------------------------------------------------

update public.subjects set
  subject_type = 'science_math',
  icon = 'orbit',
  theme_color = '#38bdf8',
  is_locked = true
where slug = 'physics';

update public.subjects set
  subject_type = 'science_math',
  icon = 'flask',
  theme_color = '#34d399',
  is_locked = true
where slug = 'chemistry';

update public.subjects set
  subject_type = 'science_math',
  icon = 'ruler',
  theme_color = '#a78bfa',
  is_locked = true
where slug = 'mathematics';

update public.subjects set
  subject_type = 'biology',
  icon = 'dna',
  theme_color = '#2dd4bf',
  is_locked = true
where slug = 'biology';

update public.subjects set
  subject_type = 'english',
  icon = 'book',
  theme_color = '#fbbf24',
  is_locked = true
where slug = 'english';

update public.subjects set
  subject_type = 'nepali',
  icon = 'pen',
  theme_color = '#fb7185',
  is_locked = true
where slug = 'nepali';

update public.subjects set
  subject_type = 'general_knowledge',
  icon = 'scale',
  theme_color = '#f59e0b',
  is_locked = true
where slug = 'governance-public-admin';

update public.subjects set
  subject_type = 'general_knowledge',
  icon = 'globe',
  theme_color = '#22d3ee',
  is_locked = true
where slug = 'nepal-geography';

update public.subjects set
  subject_type = 'general_knowledge',
  icon = 'globe',
  theme_color = '#22d3ee',
  is_locked = true
where slug = 'history';

update public.subjects set
  subject_type = 'general_knowledge',
  icon = 'globe',
  theme_color = '#22d3ee',
  is_locked = true
where slug = 'geography';

update public.subjects set
  subject_type = 'general_knowledge',
  icon = 'globe',
  theme_color = '#22d3ee',
  is_locked = true
where slug = 'current-affairs';

update public.subjects set
  subject_type = 'computer_science',
  icon = 'book',
  theme_color = '#94a3b8',
  is_locked = true
where slug = 'computer-science';

-- ---------------------------------------------------------------------
-- 4. Recreate get_content_item() - now returns the new block metadata
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

  v_level := public.current_access_level();
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
    -- public block metadata (safe: no payload leak)
    'block_type', v_item.block_type,
    'section_index', v_item.section_index,
    'note_type', v_item.note_type,
    'metadata', v_item.metadata,
    'locked_payload', case when v_allowed then v_item.locked_payload else null end,
    'variants', case when v_allowed then v_item.variants else null end
  );
end;
$$;

revoke all on function public.get_content_item(uuid) from public;
grant execute on function public.get_content_item(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Column grants - public remains payload-safe.
--    block_type / section_index / note_type / metadata are public
--    metadata; locked_payload and variants stay NOT granted.
-- ---------------------------------------------------------------------

revoke all on public.content_items from anon, authenticated;
grant select (id, topic_id, title, access_level, owner_contact, public_teaser,
  block_type, section_index, note_type, metadata, created_at, updated_at)
on public.content_items to anon, authenticated;

-- subjects metadata columns are public (catalogue cards)
grant select (id, exam_group_id, slug, name, description, sort_order,
  subject_type, icon, theme_color, is_locked)
on public.subjects to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Backfill existing rows with a sensible default so the reader works
--    without re-importing demo data.
-- ---------------------------------------------------------------------

update public.content_items set
  block_type = coalesce(block_type, 'note_concept'),
  section_index = coalesce(section_index, 3),
  metadata = case
    when metadata = '{}'::jsonb or metadata is null
      then jsonb_build_object('sourceKey', 'demo', 'contentType', 'note_concept', 'classifiedBy', 'manual')
    else metadata
  end
where block_type is null or section_index is null;