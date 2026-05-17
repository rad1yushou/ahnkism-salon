-- 015_home_results.sql
-- トップページ「施術実績」セクションの CMS テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS home_results (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL DEFAULT '',
  description  text        NOT NULL DEFAULT '',
  media_url    text,
  media_type   text        CHECK (media_type IN ('image', 'video')),
  sort_order   int         NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE home_results IS 'トップページ「施術実績」セクションの各項目';
COMMENT ON COLUMN home_results.media_url  IS 'Supabase Storage: ahnkism-public/results/{id}/...';
COMMENT ON COLUMN home_results.media_type IS 'image または video';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_home_results_sort_order
  ON home_results (sort_order);

CREATE INDEX IF NOT EXISTS idx_home_results_is_active
  ON home_results (is_active);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_home_results()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_home_results ON home_results;
CREATE TRIGGER set_updated_at_home_results
  BEFORE UPDATE ON home_results
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_home_results();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE home_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_results_public_select" ON home_results;
DROP POLICY IF EXISTS "home_results_auth_select"   ON home_results;
DROP POLICY IF EXISTS "home_results_auth_insert"   ON home_results;
DROP POLICY IF EXISTS "home_results_auth_update"   ON home_results;
DROP POLICY IF EXISTS "home_results_auth_delete"   ON home_results;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "home_results_public_select"
  ON home_results
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "home_results_auth_select"
  ON home_results
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "home_results_auth_insert"
  ON home_results
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_results_auth_update"
  ON home_results
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_results_auth_delete"
  ON home_results
  FOR DELETE
  USING (auth.role() = 'authenticated');
