-- =====================================================================
-- 0013_approval_gate_public_open.sql
-- Follow-up fix for 0012: the approval gate in get_content_item and the
-- educational_content tier policy must NOT lock Public-tier (level 4)
-- items for anonymous visitors (they have no profile row). Public items
-- stay open to everyone; tiers 1-3 require an approved profile.
-- Idempotent (create or replace / drop policy + create).
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
  v_approved boolean;
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
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  ) into v_approved;
  -- Public-tier (level 4) items stay open to everyone (including
  -- visitors without a profile); tiers 1-3 need an approved profile.
  v_allowed := v_item.access_level = 4
    or (v_level is not null and v_approved and v_item.access_level >= v_level);

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

drop policy if exists educational_content_select_full_by_tier on public.educational_content;

create policy educational_content_select_full_by_tier on public.educational_content
for select using (
  access_level = 4
  or (
    public.current_access_level() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.status = 'approved'
    )
    and access_level >= public.current_access_level()
  )
);