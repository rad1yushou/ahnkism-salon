-- 019_recruit_sections_media.sql
-- recruit_sections に media_url / media_type カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE recruit_sections
  ADD COLUMN IF NOT EXISTS media_url  text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video'));

COMMENT ON COLUMN recruit_sections.media_url  IS 'Supabase Storage: ahnkism-public/recruit-sections/{id}/...';
COMMENT ON COLUMN recruit_sections.media_type IS 'image または video（null = メディアなし）';
