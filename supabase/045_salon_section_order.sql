-- 045_salon_section_order.sql
-- スタッフ紹介・ブログを LP セクション一覧に追加（並び順管理のため）
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DROP / DELETE / 既存データ上書きなし。NOT EXISTS で重複防止。

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'labo', 'staff', '在籍スタッフ', '', 90, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'labo' AND section_type = 'staff'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'labo', 'blog', 'ブログ', '', 100, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'labo' AND section_type = 'blog'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'nit', 'staff', '在籍スタッフ', '', 90, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'nit' AND section_type = 'staff'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'nit', 'blog', 'ブログ', '', 100, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'nit' AND section_type = 'blog'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'elu', 'staff', '在籍スタッフ', '', 90, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'elu' AND section_type = 'staff'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'elu', 'blog', 'ブログ', '', 100, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'elu' AND section_type = 'blog'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'olea', 'staff', '在籍スタッフ', '', 90, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'olea' AND section_type = 'staff'
);

INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT 'olea', 'blog', 'ブログ', '', 100, true
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'olea' AND section_type = 'blog'
);
