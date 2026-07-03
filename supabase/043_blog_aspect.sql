-- 043_blog_aspect.sql
-- ブログ画像比率カラム追加（既存テーブルへの冪等追加）
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE salon_blogs
  ADD COLUMN IF NOT EXISTS featured_image_aspect text NOT NULL DEFAULT '4:3';

ALTER TABLE salon_blog_media
  ADD COLUMN IF NOT EXISTS media_aspect text NOT NULL DEFAULT '4:3';

-- 確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('salon_blogs', 'salon_blog_media')
  AND column_name IN ('featured_image_aspect', 'media_aspect')
ORDER BY table_name, column_name;
