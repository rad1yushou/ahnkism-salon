-- 021_recruit_sections_media_layout.sql
-- recruit_sections に media_layout カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE recruit_sections
  ADD COLUMN IF NOT EXISTS media_layout text NOT NULL DEFAULT 'top';

ALTER TABLE recruit_sections
  DROP CONSTRAINT IF EXISTS recruit_sections_media_layout_check;

ALTER TABLE recruit_sections
  ADD CONSTRAINT recruit_sections_media_layout_check
  CHECK (media_layout IN ('top', 'side'));

COMMENT ON COLUMN recruit_sections.media_layout IS 'メディア表示レイアウト: top=上部表示, side=本文横表示';
