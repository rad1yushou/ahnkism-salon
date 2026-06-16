-- 033_recruit_hero_slides.sql
-- 採用ページ HERO スライド（複数メディア管理）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS recruit_hero_slides (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url  text        NOT NULL,
  media_type text        CHECK (media_type IN ('image', 'video')),
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  recruit_hero_slides            IS '採用ページ HERO スライド（複数メディア）';
COMMENT ON COLUMN recruit_hero_slides.media_url  IS 'Supabase Storage: ahnkism-public/recruit/hero/slides/{timestamp}.{ext}';
COMMENT ON COLUMN recruit_hero_slides.media_type IS 'image または video';
COMMENT ON COLUMN recruit_hero_slides.sort_order IS '表示順（昇順）';

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_recruit_hero_slides_sort_order
  ON recruit_hero_slides (sort_order);

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_recruit_hero_slides ON recruit_hero_slides;
CREATE TRIGGER set_updated_at_recruit_hero_slides
  BEFORE UPDATE ON recruit_hero_slides
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE recruit_hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruit_hero_slides_public_select" ON recruit_hero_slides;
DROP POLICY IF EXISTS "recruit_hero_slides_auth_all"      ON recruit_hero_slides;

CREATE POLICY "recruit_hero_slides_public_select"
  ON recruit_hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "recruit_hero_slides_auth_all"
  ON recruit_hero_slides FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
