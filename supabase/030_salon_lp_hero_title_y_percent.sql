-- 030_salon_lp_hero_title_y_percent.sql
-- hero セクション用：店舗名テキストの縦位置を % で細かく調整できるカラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE salon_lp_sections
  ADD COLUMN IF NOT EXISTS hero_title_y_percent int NOT NULL DEFAULT 50
  CHECK (hero_title_y_percent BETWEEN 10 AND 90);

COMMENT ON COLUMN salon_lp_sections.hero_title_y_percent IS 'hero セクション専用：店舗名テキストの縦位置（10=最上部〜50=中央〜90=最下部）';
