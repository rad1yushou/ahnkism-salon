-- 039_section_media_meta.sql
-- salon_lp_section_media にタイトル・説明文カラムを追加
-- 既存データへの影響なし（nullable）
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE salon_lp_section_media
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS description text;
