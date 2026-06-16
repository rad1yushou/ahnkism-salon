-- 031_recruit_hero.sql
-- 採用ページ HERO メディア（シングルトン）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS recruit_hero (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url  text,
  media_type text        CHECK (media_type IN ('image', 'video')),
  is_active  boolean     NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  recruit_hero            IS '採用ページ HERO メディア（シングルトン運用）';
COMMENT ON COLUMN recruit_hero.media_url  IS 'Supabase Storage: ahnkism-public/recruit/hero/{timestamp}.{ext}';
COMMENT ON COLUMN recruit_hero.media_type IS 'image または video';

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_recruit_hero ON recruit_hero;
CREATE TRIGGER set_updated_at_recruit_hero
  BEFORE UPDATE ON recruit_hero
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE recruit_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruit_hero_public_select" ON recruit_hero;
DROP POLICY IF EXISTS "recruit_hero_auth_all"      ON recruit_hero;

CREATE POLICY "recruit_hero_public_select"
  ON recruit_hero FOR SELECT
  USING (is_active = true);

CREATE POLICY "recruit_hero_auth_all"
  ON recruit_hero FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 初期レコード（シングルトン: 既存データがない場合のみ INSERT）
-- ============================================================

INSERT INTO recruit_hero (media_url, media_type, is_active)
SELECT null, null, false
WHERE NOT EXISTS (SELECT 1 FROM recruit_hero);
