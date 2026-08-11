-- =====================================================================
-- 0002_seed_categories.sql
-- Seed the standard content categories.
-- =====================================================================

insert into public.categories (slug, name, description, sort_order) values
  ('class-11',          'Class 11',          'Class 11 curriculum content',                      1),
  ('class-11-e',        'Class 11 (E)',      'Class 11 extended content (E)',                    2),
  ('class-11-more',     'Class 11 More',     'Class 11 supplementary content',                   3),
  ('class-12',          'Class 12',          'Class 12 curriculum content',                      4),
  ('class-12-e',        'Class 12 (E)',      'Class 12 extended content (E)',                    5),
  ('class-12-more',     'Class 12 More',     'Class 12 supplementary content',                   6),
  ('general-knowledge', 'General Knowledge', 'General knowledge and awareness material',         7),
  ('loksewa-knowledge', 'Loksewa Knowledge', 'Loksewa exam preparation material',                8)
on conflict (slug) do nothing;
