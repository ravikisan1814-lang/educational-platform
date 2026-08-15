-- =====================================================================
-- 0009_seed_demo_contents.sql
-- REPAIR follow-up: the live educational_content table is empty, so the
-- catalog renders an empty grid. This migration:
--   1. adds the canonical `body_markdown` column (0001 defines it; the
--      live table never had it — breaks /api/contents/[id] which reads it)
--   2. grants it to authenticated exactly like file_url (tier policy
--      still gates WHICH rows any user may read)
--   3. seeds four demo rows (2 public, 1 Member, 1 Co-member) via a
--      SECURITY DEFINER function that is NOT granted to any role, so it
--      can only run from the SQL editor (owner-level access)
-- Idempotent: re-running replaces only the fixed demo ids.
-- =====================================================================

alter table public.educational_content
  add column if not exists body_markdown text;

revoke all on public.educational_content from anon, authenticated;
grant select (id, category_id, title, description, access_level, owner_contact, created_at, updated_at)
on public.educational_content to anon, authenticated;
grant select (file_url, body_markdown)
on public.educational_content to authenticated;

create or replace function public.seed_demo_contents()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.educational_content
  where id in (
    '00000000-0000-0000-0000-000000000d11',
    '00000000-0000-0000-0000-000000000d12',
    '00000000-0000-0000-0000-000000000d13',
    '00000000-0000-0000-0000-000000000d14'
  );

  insert into public.educational_content
    (id, category_id, title, description, body_markdown, file_url, access_level, owner_contact)
  values
    (
      '00000000-0000-0000-0000-000000000d11',
      (select id from public.categories where slug = 'general-knowledge'),
      'Free GK samples',
      'Open sample questions for everyone — public tier.',
      '# General Knowledge — Sample Questions

Open questions anyone can read:

1. **What is the capital of Nepal?** — Kathmandu (elevation ~1,400 m).
2. **Which is the longest river in Nepal?** — The Karnali.
3. **Who wrote the national anthem of Nepal?** — Pradeep Kumar Rai (Byakul Maila).

More samples are added as the owner publishes them. For the full bank,
join the Member tier from the header.',
      null,
      4,
      'ravikisan1814@gmail.com'
    ),
    (
      '00000000-0000-0000-0000-000000000d12',
      (select id from public.categories where slug = 'loksewa-knowledge'),
      'Loksewa basics',
      'Introductory material about Nepal''s civil service exams (PSC).',
      '# Loksewa (PSC) — Basics

The Public Service Commission (Lok Sewa Aayog) conducts civil service
exams in Nepal. Papers are grouped into:

- **General Knowledge (GK)** — polity, geography, current affairs.
- **English & Nepali language papers**
- **Technical / GK (प्राविधिक) papers** per post.

This public sample gives the general shape; the full study sets live
behind the Member tier.',
      null,
      4,
      'ravikisan1814@gmail.com'
    ),
    (
      '00000000-0000-0000-0000-000000000d13',
      (select id from public.categories where slug = 'class-11'),
      'Vector Addition & Triangular Law (Physics)',
      'Class 11 Physics — full notes with worked examples. Member tier.',
      '# Vector Addition — Triangular Law

For two vectors **A** and **B**, place the tail of **B** at the head of
**A**; the resultant **R** closes the triangle.

R = A + B

Magnitude: R = sqrt(A^2 + B^2 + 2AB cos theta)

Worked example: A = 3 N east, B = 4 N north.

R = sqrt(9 + 16) = 5 N, direction 53.13 degrees from east.

Full chapter notes, diagrams and 20+ solved problems are available to
Member-tier users. Contact the owner for upgrades.',
      'https://storage.example.com/class-11/vector-addition.pdf',
      2,
      'ravikisan1814@gmail.com'
    ),
    (
      '00000000-0000-0000-0000-000000000d14',
      (select id from public.categories where slug = 'class-12-more'),
      'Class 12 Board Solved Papers (Sample)',
      'Co-member tier — sample solved board paper with marking scheme.',
      '# Class 12 Board — Solved Paper (Sample)

Featured questions with the official-style marking scheme.

**Q1. Define electric flux.** (2 marks)

Answer: Electric flux is the number of electric field lines passing
perpendicularly through a given surface, phi = E . A = EA cos theta.

The complete set (7 subjects, 5 years) is available to Co-member and
above. Upgrade via the header button or contact the owner.',
      'https://storage.example.com/class-12-more/board-papers-sample.pdf',
      3,
      'ravikisan1814@gmail.com'
    );

  select count(*) into v_count from public.educational_content;
  return v_count;
end;
$$;

select public.seed_demo_contents();