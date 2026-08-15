-- =====================================================================
-- 0013_content_approval_gate.sql
-- Enforce account approval inside get_content_item(): non-owner users
-- whose profile is not 'active' cannot read the locked payload.
-- =====================================================================

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

  if v_level is null or auth.uid() is null then
    v_allowed := false;
  else
    v_allowed :=
      v_item.access_level >= v_level
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and (p.status = 'active' or p.access_level = 1)
      );
  end if;

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
