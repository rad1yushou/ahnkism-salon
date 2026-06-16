-- 034_salon_hero_slides.sql
-- 各店舗ページ HERO スライド（複数メディア管理）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_hero_slides (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug text        NOT NULL,
  media_url  text        NOT NULL,
  media_type text        CHECK (media_type IN ('image', 'video')),
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_hero_slides            IS '各店舗ページ HERO スライド（複数メディア）';
COMMENT ON COLUMN salon_hero_slides.salon_slug IS '店舗スラッグ: labo / nit / elu / olea';
COMMENT ON COLUMN salon_hero_slides.media_url  IS 'Supabase Storage: ahnkism-public/salons/{slug}/hero/slides/{timestamp}.{ext}';
COMMENT ON COLUMN salon_hero_slides.media_type IS 'image または video';
COMMENT ON COLUMN salon_hero_slides.sort_order IS '表示順（昇順）';

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_salon_hero_slides_salon_slug_sort_order
  ON salon_hero_slides (salon_slug, sort_order);

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_salon_hero_slides ON salon_hero_slides;
CREATE TRIGGER set_updated_at_salon_hero_slides
  BEFORE UPDATE ON salon_hero_slides
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE salon_hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_hero_slides_public_select" ON salon_hero_slides;
DROP POLICY IF EXISTS "salon_hero_slides_auth_all"      ON salon_hero_slides;

CREATE POLICY "salon_hero_slides_public_select"
  ON salon_hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "salon_hero_slides_auth_all"
  ON salon_hero_slides FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
