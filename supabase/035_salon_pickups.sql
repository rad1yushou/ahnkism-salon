-- 035_salon_pickups.sql
-- 各店舗ページ専用 Pick Up（ホームページ pickups とは独立）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_pickups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug text        NOT NULL,
  image_url  text,
  alt        text,
  label      text,
  link_href  text,
  media_type text        NOT NULL DEFAULT 'image'
             CHECK (media_type IN ('image', 'video')),
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_pickups            IS '各店舗ページ専用 Pick Up（ホームページ pickups とは独立）';
COMMENT ON COLUMN salon_pickups.salon_slug IS '店舗スラッグ: labo / nit / elu / olea';
COMMENT ON COLUMN salon_pickups.media_type IS 'image または video';
COMMENT ON COLUMN salon_pickups.sort_order IS '表示順（昇順）';

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_salon_pickups_salon_slug_sort_order
  ON salon_pickups (salon_slug, sort_order);

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_salon_pickups ON salon_pickups;
CREATE TRIGGER set_updated_at_salon_pickups
  BEFORE UPDATE ON salon_pickups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE salon_pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_pickups_public_select" ON salon_pickups;
DROP POLICY IF EXISTS "salon_pickups_auth_all"      ON salon_pickups;

CREATE POLICY "salon_pickups_public_select"
  ON salon_pickups FOR SELECT
  USING (is_active = true);

CREATE POLICY "salon_pickups_auth_all"
  ON salon_pickups FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
