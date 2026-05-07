-- 004_draft_columns.sql
-- hero_slides と pickups にドラフト列・updated_at を追加する

-- ================================================================
-- 1. hero_slides: NOT NULL 制約を緩和
-- ================================================================
ALTER TABLE hero_slides ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE hero_slides ALTER COLUMN alt       DROP NOT NULL;

-- ================================================================
-- 2. hero_slides: ドラフト列を追加
-- ================================================================
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS draft_image_url TEXT,
  ADD COLUMN IF NOT EXISTS draft_alt       TEXT,
  ADD COLUMN IF NOT EXISTS draft_label     TEXT;

-- ================================================================
-- 3. hero_slides: updated_at 列を追加
-- ================================================================
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ================================================================
-- 4. pickups: NOT NULL 制約を緩和（既存制約がある場合のみ影響）
-- ================================================================
ALTER TABLE pickups ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE pickups ALTER COLUMN alt       DROP NOT NULL;

-- ================================================================
-- 5. pickups: ドラフト列を追加
-- ================================================================
ALTER TABLE pickups
  ADD COLUMN IF NOT EXISTS draft_image_url TEXT,
  ADD COLUMN IF NOT EXISTS draft_alt       TEXT,
  ADD COLUMN IF NOT EXISTS draft_label     TEXT,
  ADD COLUMN IF NOT EXISTS draft_link_href TEXT;

-- ================================================================
-- 6. pickups: updated_at 列を追加
-- ================================================================
ALTER TABLE pickups
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ================================================================
-- 7. updated_at 自動更新用トリガー関数（共通）
-- ================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ================================================================
-- 8. hero_slides: updated_at トリガーを登録
-- ================================================================
DROP TRIGGER IF EXISTS set_updated_at_hero_slides ON hero_slides;
CREATE TRIGGER set_updated_at_hero_slides
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
-- 9. pickups: updated_at トリガーを登録
-- ================================================================
DROP TRIGGER IF EXISTS set_updated_at_pickups ON pickups;
CREATE TRIGGER set_updated_at_pickups
  BEFORE UPDATE ON pickups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
