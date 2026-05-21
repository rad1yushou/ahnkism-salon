-- 024_recruit_sections_media_layout_positions.sql
-- recruit_sections.media_layout を top/bottom/left/right の4択に拡張
-- 既存の side データを left に移行
-- 実行場所: Supabase ダッシュボード > SQL Editor

UPDATE recruit_sections
SET media_layout = 'left'
WHERE media_layout = 'side';

ALTER TABLE recruit_sections
  DROP CONSTRAINT IF EXISTS recruit_sections_media_layout_check;

ALTER TABLE recruit_sections
  ADD CONSTRAINT recruit_sections_media_layout_check
  CHECK (media_layout IN ('top', 'bottom', 'left', 'right'));

COMMENT ON COLUMN recruit_sections.media_layout IS 'メディア配置: top=上, bottom=下, left=左, right=右';
