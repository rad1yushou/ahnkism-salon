-- 049_blog_preview_count.sql
-- salon_lp_sections に blog_preview_count カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DROP / DELETE / 既存データ変更なし。ADD COLUMN + 制約追加のみ。

ALTER TABLE salon_lp_sections
  ADD COLUMN IF NOT EXISTS blog_preview_count int NOT NULL DEFAULT 5;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'salon_lp_sections_blog_preview_count_check'
  ) THEN
    ALTER TABLE salon_lp_sections
      ADD CONSTRAINT salon_lp_sections_blog_preview_count_check
      CHECK (blog_preview_count >= 1 AND blog_preview_count <= 20);
  END IF;
END $$;
