-- =====================================================================
-- 0004_hierarchy_content_items.sql
-- Strict multi-tier hierarchy for deep learning:
--
--   exam_groups (Loksewa, General Knowledge, Academic Core)
--     -> subjects        (Physics, Governance & Public Admin, ...)
--       -> chapters      (Mechanics, Optics, Constitutional Law, ...)
--         -> sub_chapters (Vectors, Fundamental Rights, ...)
--           -> topics     (Vector Addition, Right to Equality, ...)
--             -> content_items
--
-- content_items carries the tiered payload model:
--   * public_teaser   - the ~10% introductory concept, open to ALL visitors.
--   * locked_payload  - the remaining ~90% (statements, detailed concepts,
--                       bullet points, summaries, examples, PYQs).
--   * variants        - JSONB array of repeated notes as Type 1 / Type 2 /
--                       Type 3 tabs with distinct content/interfaces.
--
-- SECURITY MODEL (leak-proof by construction):
--   * The hierarchy tables (exam_groups .. topics) are PUBLIC READ - titles,
--     covers and cards are open so visitors can freely explore the syllabus
--     map. No locks exist at card level.
--   * content_items is split by COLUMN GRANTS:
--       - anon / authenticated : id, topic_id, title, access_level,
--                                owner_contact, public_teaser, timestamps
--       - locked_payload, variants : NOT granted to anon/authenticated AT ALL.
--         A lower-tier client cannot read the 90% payload even by querying
--         the database directly - the columns are not selectable.
--   * The ONLY way to read locked_payload / variants is the SECURITY DEFINER
--     RPC get_content_item(uuid) which re-checks
--     content_item.access_level >= public.current_access_level()
--     inside PostgreSQL and returns NULL locked fields for under-tier users.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Hierarchy tables
-- ---------------------------------------------------------------------

create table public.exam_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  exam_group_id uuid not null references public.exam_groups (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_group_id, slug)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

create table public.sub_chapters (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  sub_chapter_id uuid not null references public.sub_chapters (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sub_chapter_id, slug)
);

-- ---------------------------------------------------------------------
-- 2. content_items - tiered payload
-- ---------------------------------------------------------------------

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  title text not null,
  access_level smallint not null default 4 check (access_level between 1 and 4),
  owner_contact text,
  public_teaser text not null default '',
  locked_payload text not null default '',
  variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, title)
);

-- Indexes
create index subjects_exam_group_id_idx on public.subjects (exam_group_id);
create index chapters_subject_id_idx on public.chapters (subject_id);
create index sub_chapters_chapter_id_idx on public.sub_chapters (chapter_id);
create index topics_sub_chapter_id_idx on public.topics (sub_chapter_id);
create index content_items_topic_id_idx on public.content_items (topic_id);
create index content_items_access_level_idx on public.content_items (access_level);

-- ---------------------------------------------------------------------
-- 3. updated_at maintenance
-- ---------------------------------------------------------------------

create trigger exam_groups_set_updated_at
before update on public.exam_groups
for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger chapters_set_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

create trigger sub_chapters_set_updated_at
before update on public.sub_chapters
for each row execute function public.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. RLS enable
-- ---------------------------------------------------------------------

alter table public.exam_groups enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.sub_chapters enable row level security;
alter table public.topics enable row level security;
alter table public.content_items enable row level security;

-- ---------------------------------------------------------------------
-- 5. SECURITY DEFINER accessor for the locked payload.
--    Single gate for locked_payload / variants. Re-checks the tier INSIDE
--    SQL: content_item.access_level >= current_access_level().
--    Always returns metadata + public_teaser + variant_labels + is_locked;
--    returns locked_payload + variants ONLY when the tier passes.
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

  v_level := public.current_access_level(); -- NULL for anon/unknown
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
    'locked_payload', case when v_allowed then v_item.locked_payload else null end,
    'variants', case when v_allowed then v_item.variants else null end
  );
end;
$$;

revoke all on function public.get_content_item(uuid) from public;
grant execute on function public.get_content_item(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. RLS policies
-- ---------------------------------------------------------------------

-- hierarchy tables: open read for everyone; owner-only writes.
-- (Writes are performed via the service_role key, which bypasses RLS.)

create policy exam_groups_select_all on public.exam_groups
for select using (true);
create policy exam_groups_insert_admin on public.exam_groups
for insert with check (public.current_access_level() = 1);
create policy exam_groups_update_admin on public.exam_groups
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy exam_groups_delete_admin on public.exam_groups
for delete using (public.current_access_level() = 1);

create policy subjects_select_all on public.subjects
for select using (true);
create policy subjects_insert_admin on public.subjects
for insert with check (public.current_access_level() = 1);
create policy subjects_update_admin on public.subjects
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy subjects_delete_admin on public.subjects
for delete using (public.current_access_level() = 1);

create policy chapters_select_all on public.chapters
for select using (true);
create policy chapters_insert_admin on public.chapters
for insert with check (public.current_access_level() = 1);
create policy chapters_update_admin on public.chapters
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy chapters_delete_admin on public.chapters
for delete using (public.current_access_level() = 1);

create policy sub_chapters_select_all on public.sub_chapters
for select using (true);
create policy sub_chapters_insert_admin on public.sub_chapters
for insert with check (public.current_access_level() = 1);
create policy sub_chapters_update_admin on public.sub_chapters
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy sub_chapters_delete_admin on public.sub_chapters
for delete using (public.current_access_level() = 1);

create policy topics_select_all on public.topics
for select using (true);
create policy topics_insert_admin on public.topics
for insert with check (public.current_access_level() = 1);
create policy topics_update_admin on public.topics
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy topics_delete_admin on public.topics
for delete using (public.current_access_level() = 1);

-- content_items metadata is open (drives the syllabus map + owner contact);
-- the raw columns are NOT granted below, so this policy cannot leak them.
create policy content_items_select_metadata on public.content_items
for select using (true);

create policy content_items_insert_admin on public.content_items
for insert with check (public.current_access_level() = 1);
create policy content_items_update_admin on public.content_items
for update using (public.current_access_level() = 1)
with check (public.current_access_level() = 1);
create policy content_items_delete_admin on public.content_items
for delete using (public.current_access_level() = 1);

-- ---------------------------------------------------------------------
-- 7. Column-level grants (defense in depth - the real gate)
-- ---------------------------------------------------------------------

revoke all on public.exam_groups from anon, authenticated;
revoke all on public.subjects from anon, authenticated;
revoke all on public.chapters from anon, authenticated;
revoke all on public.sub_chapters from anon, authenticated;
revoke all on public.topics from anon, authenticated;
revoke all on public.content_items from anon, authenticated;

-- hierarchy tables: full read for everyone (navigation is always open)
grant select on public.exam_groups, public.subjects, public.chapters,
  public.sub_chapters, public.topics to anon, authenticated;

-- content_items: metadata + public_teaser only.
-- locked_payload and variants are NOT granted to anon/authenticated - a
-- client query can never select them. Only get_content_item() (SECURITY
-- DEFINER, tier-checked) can return them.
grant select (id, topic_id, title, access_level, owner_contact, public_teaser, created_at, updated_at)
on public.content_items to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Seed - demo hierarchy (idempotent)
-- ---------------------------------------------------------------------

-- Exam groups
insert into public.exam_groups (slug, name, description, sort_order) values
  ('loksewa',           'Loksewa',           'Loksewa / Public Service Commission exam preparation.', 1),
  ('general-knowledge', 'General Knowledge', 'General knowledge and current awareness material.',       2),
  ('academic-core',     'Academic Core',     'NEB Class 11 & 12 core subjects.',                         3)
on conflict (slug) do nothing;

-- Subjects
insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'governance-public-admin', 'Governance & Public Admin', 'Constitution, administrative law, and public administration.', 1
from public.exam_groups g where g.slug = 'loksewa'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'nepal-geography', 'Nepal Geography', 'Physical and economic geography of Nepal.', 2
from public.exam_groups g where g.slug = 'loksewa'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'history', 'History', 'Ancient, medieval and modern history of Nepal.', 3
from public.exam_groups g where g.slug = 'loksewa'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'geography', 'Geography', 'World and Nepal geography for general knowledge.', 1
from public.exam_groups g where g.slug = 'general-knowledge'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'current-affairs', 'Current Affairs', 'Recent national and international events.', 2
from public.exam_groups g where g.slug = 'general-knowledge'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'physics', 'Physics', 'Mechanics, optics, heat, electricity and modern physics.', 1
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'chemistry', 'Chemistry', 'Physical, organic and inorganic chemistry.', 2
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'mathematics', 'Mathematics', 'Algebra, calculus, geometry and statistics.', 3
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'biology', 'Biology', 'Cell biology, genetics and ecology.', 4
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'english', 'English', 'Grammar, literature and composition.', 5
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'nepali', 'Nepali', 'Nepali language, literature and grammar.', 6
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

insert into public.subjects (exam_group_id, slug, name, description, sort_order)
select g.id, 'computer-science', 'Computer Science', 'Programming, databases and computer fundamentals.', 7
from public.exam_groups g where g.slug = 'academic-core'
on conflict (exam_group_id, slug) do nothing;

-- Chapters
insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'constitutional-law', 'Constitutional Law', 'Nepal constitution, fundamental rights and duties.', 1
from public.subjects s where s.slug = 'governance-public-admin'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'administrative-law', 'Administrative Law', 'Public administration, bureaucracy and tribunals.', 2
from public.subjects s where s.slug = 'governance-public-admin'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'physical-geography', 'Physical Geography', 'Landforms, rivers, climate and ecosystems of Nepal.', 1
from public.subjects s where s.slug = 'nepal-geography'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'ancient-nepal', 'Ancient Nepal', 'Kiran, Lichchhavi and Malla periods.', 1
from public.subjects s where s.slug = 'history'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'mechanics', 'Mechanics', 'Vectors, kinematics, dynamics and Newton laws.', 1
from public.subjects s where s.slug = 'physics'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'optics', 'Optics', 'Reflection, refraction, mirrors and lenses.', 2
from public.subjects s where s.slug = 'physics'
on conflict (subject_id, slug) do nothing;

insert into public.chapters (subject_id, slug, name, description, sort_order)
select s.id, 'heat', 'Heat', 'Thermodynamics, calorimetry and specific heat.', 3
from public.subjects s where s.slug = 'physics'
on conflict (subject_id, slug) do nothing;

-- Sub-chapters
insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'vectors', 'Vectors', 'Vector operations and applications.', 1
from public.chapters c where c.slug = 'mechanics'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'kinematics', 'Kinematics', 'Motion in one and two dimensions.', 2
from public.chapters c where c.slug = 'mechanics'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'reflection-curved-surfaces', 'Reflection on Curved Surfaces', 'Mirror formula and image formation.', 1
from public.chapters c where c.slug = 'optics'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'refraction', 'Refraction', 'Snell law, lenses and prisms.', 2
from public.chapters c where c.slug = 'optics'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'thermodynamics', 'Thermodynamics', 'Laws of thermodynamics and heat engines.', 1
from public.chapters c where c.slug = 'heat'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'fundamental-rights', 'Fundamental Rights', 'Rights and freedoms guaranteed by the constitution.', 1
from public.chapters c where c.slug = 'constitutional-law'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'executive', 'Executive', 'President, Prime Minister and Council of Ministers.', 2
from public.chapters c where c.slug = 'constitutional-law'
on conflict (chapter_id, slug) do nothing;

insert into public.sub_chapters (chapter_id, slug, name, description, sort_order)
select c.id, 'rivers-of-nepal', 'Rivers of Nepal', 'Major river systems and their basins.', 1
from public.chapters c where c.slug = 'physical-geography'
on conflict (chapter_id, slug) do nothing;

-- Topics
insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'vector-addition', 'Vector Addition', 'Adding vectors graphically and by components.', 1
from public.sub_chapters sc where sc.slug = 'vectors'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'resolution-of-vectors', 'Resolution of Vectors', 'Splitting vectors into components.', 2
from public.sub_chapters sc where sc.slug = 'vectors'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'mirror-formula', 'Mirror Formula', '1/f = 1/v + 1/u and sign conventions.', 1
from public.sub_chapters sc where sc.slug = 'reflection-curved-surfaces'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'image-formation', 'Image Formation by Mirrors', 'Ray diagrams for concave and convex mirrors.', 2
from public.sub_chapters sc where sc.slug = 'reflection-curved-surfaces'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'right-to-equality', 'Right to Equality', 'Article 18 of the Constitution of Nepal.', 1
from public.sub_chapters sc where sc.slug = 'fundamental-rights'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'right-to-freedom', 'Right to Freedom', 'Freedom of speech, expression and movement.', 2
from public.sub_chapters sc where sc.slug = 'fundamental-rights'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'koshi-river-system', 'Koshi River System', 'Seven tributaries and the Saptakoshi basin.', 1
from public.sub_chapters sc where sc.slug = 'rivers-of-nepal'
on conflict (sub_chapter_id, slug) do nothing;

insert into public.topics (sub_chapter_id, slug, name, description, sort_order)
select sc.id, 'gandaki-river-system', 'Gandaki River System', 'Kali, Trishuli and Narayani rivers.', 2
from public.sub_chapters sc where sc.slug = 'rivers-of-nepal'
on conflict (sub_chapter_id, slug) do nothing;

-- Content items (idempotent via unique (topic_id, title))
insert into public.content_items
  (topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants)
select t.id,
  'Vector Addition - Full Notes',
  2,
  'ravikisan1814@gmail.com',
  '<p>Vectors are quantities that have both <strong>magnitude</strong> and <strong>direction</strong>. This concept page introduces how vectors are represented and why they matter in physics.</p>',
  '<h3>Vector Addition - Detailed Notes</h3><p>When two or more vectors are added, the result is the <strong>resultant vector</strong>. Methods include the triangle law, parallelogram law and the component method.</p><ul><li><strong>Triangle law:</strong> place vectors head-to-tail; the resultant closes the triangle.</li><li><strong>Parallelogram law:</strong> draw both from a common origin; the diagonal is the resultant.</li><li><strong>Component method:</strong> R_x = sum(A_x ...), R_y = sum(A_y ...), |R| = sqrt(R_x^2 + R_y^2).</li></ul><h4>Solved example</h4><p>Add A = 3i + 4j and B = 5i - 2j: R = 8i + 2j, |R| = sqrt(68) units.</p><h4>Past Year Questions</h4><ol><li>State the parallelogram law of vectors. (NEB 2079)</li><li>A boat crosses a river with velocity 5 m/s; river flows at 3 m/s. Find the resultant velocity. (NEB 2080)</li></ol>',
  jsonb_build_array(
    jsonb_build_object('label', 'Type 2', 'interface', 'qa',
      'content', '<h3>Vector Addition - Q&A variant</h3><p>Question-focused revision notes built for repeated practice.</p><ol><li><strong>Q:</strong> Difference between scalar and vector? <strong>A:</strong> Vector has direction; scalar does not.</li><li><strong>Q:</strong> When is the resultant maximum? <strong>A:</strong> When angle between vectors is 0&deg;.</li></ol>'),
    jsonb_build_object('label', 'Type 3', 'interface', 'cards',
      'content', '<h3>Vector Addition - Formula cards</h3><div class="variant-cards"><div class="variant-card"><h4>Magnitude</h4><p>|R| = sqrt(A^2 + B^2 + 2AB cos &theta;)</p></div><div class="variant-card"><h4>Direction</h4><p>tan &phi; = (B sin &theta;) / (A + B cos &theta;)</p></div></div>')
  )
from public.topics t where t.slug = 'vector-addition'
on conflict (topic_id, title) do nothing;

insert into public.content_items
  (topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants)
select t.id,
  'Right to Equality - Constitution Notes',
  3,
  'ravikisan1814@gmail.com',
  '<p>The Constitution of Nepal guarantees equality before the law and equal protection of the laws for all citizens. This is the foundational concept of Part 3, Fundamental Rights.</p>',
  '<h3>Right to Equality - Article 18</h3><p>Article 18 of the Constitution of Nepal (2072) provides that all citizens are equal before the law. No discrimination is allowed on grounds of religion, race, gender, caste, tribe, origin, disability or similar.</p><ul><li><strong>Equal protection:</strong> the state must not discriminate except for affirmative action for the disadvantaged.</li><li><strong>Employment:</strong> equal opportunity in public service.</li><li><strong>Women:</strong> special provisions permit reserved seats.</li></ul><h4>Past Year Questions</h4><ol><li>Explain the scope of the right to equality under Article 18. (Loksewa 2079)</li><li>Critically evaluate affirmative action in the context of equality. (Loksewa 2080)</li></ol>',
  '[]'::jsonb
from public.topics t where t.slug = 'right-to-equality'
on conflict (topic_id, title) do nothing;

insert into public.content_items
  (topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants)
select t.id,
  'Koshi River System - GK Notes',
  4,
  'ravikisan1814@gmail.com',
  '<p>The Koshi is the largest river of Nepal, draining the eastern third of the country. Its seven tributaries give it the name <em>Saptakoshi</em>.</p>',
  '<h3>Koshi River System - Full Notes</h3><p>The Koshi system comprises seven tributaries: Tamor, Arun, Sun Kosi, Indrawati, Bhote Koshi, Dudh Koshi and Tamakoshi. The river enters India as the Kosi and forms part of the Ganges system.</p><ul><li><strong>Source:</strong> Himalayas - the Arun rises in Tibet.</li><li><strong>Length:</strong> ~720 km total; ~200 km inside Nepal.</li><li><strong>Hydropower:</strong> Saptakoshi High Dam is a multipurpose project under consideration.</li><li><strong>Geography:</strong> The Koshi Tappu Wildlife Reserve protects endangered water buffalo (arnas) and many migratory birds.</li></ul><h4>Past Year Questions</h4><ol><li>Name the seven tributaries of the Koshi river. (Loksewa GK 2080)</li><li>Which wildlife reserve lies in the Koshi floodplain? (PSC)</li></ol>',
  '[]'::jsonb
from public.topics t where t.slug = 'koshi-river-system'
on conflict (topic_id, title) do nothing;

insert into public.content_items
  (topic_id, title, access_level, owner_contact, public_teaser, locked_payload, variants)
select t.id,
  'Mirror Formula - Optics Notes',
  2,
  'ravikisan1814@gmail.com',
  '<p>The mirror formula relates object distance (u), image distance (v) and focal length (f) for spherical mirrors: 1/f = 1/u + 1/v.</p>',
  '<h3>Mirror Formula - Detailed Notes</h3><p>For concave and convex mirrors, the mirror formula 1/f = 1/u + 1/v connects the focal length, object distance and image distance. Magnification m = -v/u = h_i/h_o.</p><ul><li><strong>Sign convention:</strong> distances measured from the pole; real distances positive along incident light.</li><li><strong>Concave mirror:</strong> f is real (positive) when the object is beyond the focus.</li><li><strong>Convex mirror:</strong> f is virtual (negative); images are always diminished and erect.</li></ul><h4>Worked example</h4><p>An object is 20 cm from a concave mirror of focal length 10 cm: 1/10 = 1/20 + 1/v -> v = 20 cm; m = -1 (same size, inverted, real).</p><h4>Past Year Questions</h4><ol><li>Derive the mirror formula using ray geometry. (NEB 2079)</li><li>A concave mirror forms a real image twice the size of the object; find v if f = 12 cm. (NEB 2080)</li></ol>',
  '[]'::jsonb
from public.topics t where t.slug = 'mirror-formula'
on conflict (topic_id, title) do nothing;
