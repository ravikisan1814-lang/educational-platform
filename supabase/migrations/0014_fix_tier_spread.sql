-- =====================================================================
-- 0014_fix_tier_spread.sql
-- 0012's tier assignment used ('x'||md5...8 hex)::bit(32)::int — bit 31
-- is the SIGN bit, so about half the rows became full negative ints and
-- matched `bucket < 10` (Public), leaving 75/137 items public instead of
-- ~10%. This re-runs the spread with a sign-free 24-bit hash
-- (6 hex chars -> bit(24)::int is always positive):
--   bucket < 10 -> level 4 (Public)      => public reads ~10%
--   bucket < 25 -> level 3 (Co-member)   => ~25% cumulative
--   bucket < 50 -> level 2 (Member)      => ~50% cumulative
--   bucket >=50 -> level 1 (Owner)       => 100% cumulative
-- Applies to ALL current items (uniform rule over the whole catalog).
-- Idempotent (deterministic recomputation).
-- =====================================================================

update public.content_items as ci
set access_level = case
  when h.bucket < 10 then 4
  when h.bucket < 25 then 3
  when h.bucket < 50 then 2
  else 1
end
from (
  select id, (('x' || substr(md5(id::text), 1, 6))::bit(24)::int % 100) as bucket
  from public.content_items
) as h
where ci.id = h.id;

select '0014-OK' as result;