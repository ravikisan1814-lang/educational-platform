-- =====================================================================
-- 0012_approval_flow_and_tier_spread.sql (v3)
-- Owner-requested feature set:
--   1. `profiles.status` ('pending' | 'approved' | 'rejected') — new
--      signups start PENDING; existing users are backfilled 'approved'.
--   2. Approval gate enforced at the real tier gates (NO function
--      signature changes, so no 42P13): `get_content_item` requires an
--      approved profile for locked payloads, and the
--      educational_content full-content policy requires it too. Pending
--      users see metadata + teasers only (like anonymous visitors).
--   3. The 135 imported content items (all Public/level 4) are locked
--      across the requested spread — cumulative visibility:
--      Public 10% (level 4), Co-member 25% (level 3), Member 50%
--      (level 2), Owner 100% (level 1 + everything below). Deterministic
--      by id hash; only touches rows currently level 4.
--   4. Grants: profiles.status readable; access_level/status updatable by
--      authenticated (RLS update policy still owner-only).
-- Idempotent. Ends with `select '0012-OK';`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Approval status
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text not null default 'pending';

comment on column public.profiles.status is
  'Approval gate: new signups are ''pending'' until the owner approves;'
  ' tier gates (get_content_item, educational_content tier policy) fail'
  ' closed for non-approved users.';

update public.profiles
set status = 'approved'
where status = 'pending';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, access_level, status)
  values (new.id, coalesce(new.email, ''), 'member', 4, 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Approval gate inside the single locked-payload accessor
--    (same signature `returns jsonb` — safe to replace)
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

  v_level := public.current_access_level(); -- NULL for anon/unknown
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  ) into v_approved;
  v_allowed := v_level is not null and v_approved and v_item.access_level >= v_level;

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

-- ---------------------------------------------------------------------
-- 3. Approval gate in the educational_content full-content policy
-- ---------------------------------------------------------------------

drop policy if exists educational_content_select_full_by_tier on public.educational_content;

create policy educational_content_select_full_by_tier on public.educational_content
for select using (
  public.current_access_level() is not null
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  )
  and access_level >= public.current_access_level()
);

-- ---------------------------------------------------------------------
-- 4. Grants
-- ---------------------------------------------------------------------

grant select (id, email, role, access_level, status, created_at)
  on public.profiles to authenticated;
grant update (access_level, status)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- 5. Lock the imported content across the tier spread
--      bucket < 10 -> level 4 (Public)      => public reads 10%
--      bucket < 25 -> level 3 (Co-member)   => 25% cumulative
--      bucket < 50 -> level 2 (Member)      => 50% cumulative
--      bucket >=50 -> level 1 (Owner)       => 100% cumulative
-- ---------------------------------------------------------------------

update public.content_items as ci
set access_level = case
  when h.bucket < 10 then 4
  when h.bucket < 25 then 3
  when h.bucket < 50 then 2
  else 1
end
from (
  select id, (('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 100) as bucket
  from public.content_items
  where access_level = 4
) as h
where ci.id = h.id;

select '0012-OK' as result;