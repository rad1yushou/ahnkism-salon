-- 026_menus_media_aspect_vertical.sql
-- menus.media_aspect に vertical (9:16) を追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE menus
  DROP CONSTRAINT IF EXISTS menus_media_aspect_check;

ALTER TABLE menus
  ADD CONSTRAINT menus_media_aspect_check
  CHECK (media_aspect IN ('video', 'portrait', 'square', 'vertical'));

COMMENT ON COLUMN menus.media_aspect IS 'メディア比率: video=16:9, portrait=4:5, square=1:1, vertical=9:16';
