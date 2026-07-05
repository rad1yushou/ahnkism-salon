-- 044_blog_display_order.sql
-- ブログ詳細ページの表示順・メディア種別カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE salon_blogs
  ADD COLUMN IF NOT EXISTS display_order text NOT NULL DEFAULT 'body_first';

ALTER TABLE salon_blog_media
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
