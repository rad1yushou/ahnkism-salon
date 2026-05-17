-- 016_home_reviews.sql
-- トップページ「口コミ」セクションの CMS テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS home_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text        NOT NULL DEFAULT '',
  rating       numeric     NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  body         text        NOT NULL DEFAULT '',
  menu_label   text        NOT NULL DEFAULT '',
  salon_label  text        NOT NULL DEFAULT '',
  sort_order   int         NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE home_reviews IS 'トップページ「口コミ」セクションの各項目';
COMMENT ON COLUMN home_reviews.display_name IS '表示名（例: M.K さん）';
COMMENT ON COLUMN home_reviews.rating       IS '評価（1〜5、小数可）';
COMMENT ON COLUMN home_reviews.body         IS '口コミ本文';
COMMENT ON COLUMN home_reviews.menu_label   IS '施術メニュー（自由テキスト）';
COMMENT ON COLUMN home_reviews.salon_label  IS '来店店舗（自由テキスト）';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_home_reviews_sort_order
  ON home_reviews (sort_order);

CREATE INDEX IF NOT EXISTS idx_home_reviews_is_active
  ON home_reviews (is_active);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_home_reviews()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_home_reviews ON home_reviews;
CREATE TRIGGER set_updated_at_home_reviews
  BEFORE UPDATE ON home_reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_home_reviews();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE home_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_reviews_public_select" ON home_reviews;
DROP POLICY IF EXISTS "home_reviews_auth_select"   ON home_reviews;
DROP POLICY IF EXISTS "home_reviews_auth_insert"   ON home_reviews;
DROP POLICY IF EXISTS "home_reviews_auth_update"   ON home_reviews;
DROP POLICY IF EXISTS "home_reviews_auth_delete"   ON home_reviews;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "home_reviews_public_select"
  ON home_reviews
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "home_reviews_auth_select"
  ON home_reviews
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "home_reviews_auth_insert"
  ON home_reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_reviews_auth_update"
  ON home_reviews
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_reviews_auth_delete"
  ON home_reviews
  FOR DELETE
  USING (auth.role() = 'authenticated');
