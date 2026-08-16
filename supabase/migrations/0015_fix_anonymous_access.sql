-- Fix anonymous access to public content.
--
-- get_content_item previously required current_access_level() to be non-null,
-- which locked out anonymous visitors from ALL content — even public tier-4 notes.
-- This updates the gate so anonymous visitors default to tier 4 (public), while
-- authenticated users still must meet the content's minimum access_level.

create or replace function public.get_content_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
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
  v_allowed := v_item.access_level >= coalesce(v_level, 4);

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
