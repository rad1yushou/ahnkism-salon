-- 023_recruit_sections_media_display.sql
-- recruit_sections に media_aspect / media_position カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE recruit_sections
  ADD COLUMN IF NOT EXISTS media_aspect   text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS media_position text NOT NULL DEFAULT 'center';

ALTER TABLE recruit_sections
  DROP CONSTRAINT IF EXISTS recruit_sections_media_aspect_check;

ALTER TABLE recruit_sections
  ADD CONSTRAINT recruit_sections_media_aspect_check
  CHECK (media_aspect IN ('video', 'portrait', 'square'));

ALTER TABLE recruit_sections
  DROP CONSTRAINT IF EXISTS recruit_sections_media_position_check;

ALTER TABLE recruit_sections
  ADD CONSTRAINT recruit_sections_media_position_check
  CHECK (media_position IN ('center', 'top', 'bottom', 'left', 'right'));

COMMENT ON COLUMN recruit_sections.media_aspect   IS 'メディア比率: video=16:9, portrait=4:5, square=1:1';
COMMENT ON COLUMN recruit_sections.media_position IS 'メディア表示位置: center/top/bottom/left/right';
