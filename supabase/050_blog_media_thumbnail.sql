-- 050_blog_media_thumbnail.sql
-- salon_blog_media に thumbnail_url カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DROP / DELETE / 既存データ変更なし。ADD COLUMN のみ。

ALTER TABLE salon_blog_media
  ADD COLUMN IF NOT EXISTS thumbnail_url text;
