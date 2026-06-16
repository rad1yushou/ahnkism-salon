-- 029_salon_lp_hero_title_position.sql
-- salon_lp_sections の hero セクション用：店舗名テキスト表示位置カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE salon_lp_sections
  ADD COLUMN IF NOT EXISTS hero_title_position text NOT NULL DEFAULT 'center'
  CHECK (hero_title_position IN ('top', 'center', 'bottom'));

COMMENT ON COLUMN salon_lp_sections.hero_title_position IS 'hero セクション専用：店舗名テキストの縦位置 top / center / bottom';
