-- 025_menus_media_and_faqs.sql
-- menus に詳細ページ用メディアカラムを追加
-- menu_faqs に is_active / created_at / updated_at を追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- menus: 詳細ページ用メディアカラム追加
-- ============================================================

ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS media_url      text,
  ADD COLUMN IF NOT EXISTS media_type     text,
  ADD COLUMN IF NOT EXISTS media_aspect   text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS media_position text NOT NULL DEFAULT 'center';

ALTER TABLE menus
  DROP CONSTRAINT IF EXISTS menus_media_aspect_check;

ALTER TABLE menus
  ADD CONSTRAINT menus_media_aspect_check
  CHECK (media_aspect IN ('video', 'portrait', 'square'));

ALTER TABLE menus
  DROP CONSTRAINT IF EXISTS menus_media_position_check;

ALTER TABLE menus
  ADD CONSTRAINT menus_media_position_check
  CHECK (media_position IN ('center', 'top', 'bottom', 'left', 'right'));

COMMENT ON COLUMN menus.media_url      IS '詳細ページ用メディア URL（image_url は一覧サムネ用として別途維持）';
COMMENT ON COLUMN menus.media_type     IS 'image または video';
COMMENT ON COLUMN menus.media_aspect   IS 'メディア比率: video=16:9, portrait=4:5, square=1:1';
COMMENT ON COLUMN menus.media_position IS 'メディア表示位置: center/top/bottom/left/right';

-- ============================================================
-- menu_faqs: is_active / created_at / updated_at を追加
-- ============================================================

ALTER TABLE menu_faqs
  ADD COLUMN IF NOT EXISTS is_active   boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN menu_faqs.is_active IS '公開フラグ。false は公開側に表示しない';

-- updated_at 自動更新 trigger
DROP TRIGGER IF EXISTS set_updated_at_menu_faqs ON menu_faqs;
CREATE TRIGGER set_updated_at_menu_faqs
  BEFORE UPDATE ON menu_faqs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
