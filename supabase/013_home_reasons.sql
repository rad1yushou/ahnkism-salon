-- 013_home_reasons.sql
-- トップページ「選ばれる理由」セクションの CMS テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS home_reasons (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  number_label  text        NOT NULL DEFAULT '',
  title         text        NOT NULL DEFAULT '',
  description   text        NOT NULL DEFAULT '',
  media_url     text,
  media_type    text        CHECK (media_type IN ('image', 'video')),
  sort_order    int         NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE home_reasons IS 'トップページ「選ばれる理由」セクションの各項目';
COMMENT ON COLUMN home_reasons.number_label IS '表示番号ラベル。例: 01 / 02 / 03';
COMMENT ON COLUMN home_reasons.media_url    IS 'Supabase Storage: ahnkism-public/reasons/{id}/...';
COMMENT ON COLUMN home_reasons.media_type   IS 'image または video';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_home_reasons_sort_order
  ON home_reasons (sort_order);

CREATE INDEX IF NOT EXISTS idx_home_reasons_is_active
  ON home_reasons (is_active);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_home_reasons()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_home_reasons ON home_reasons;
CREATE TRIGGER set_updated_at_home_reasons
  BEFORE UPDATE ON home_reasons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_home_reasons();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE home_reasons ENABLE ROW LEVEL SECURITY;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "home_reasons_public_select"
  ON home_reasons
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "home_reasons_auth_select"
  ON home_reasons
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "home_reasons_auth_insert"
  ON home_reasons
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_reasons_auth_update"
  ON home_reasons
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_reasons_auth_delete"
  ON home_reasons
  FOR DELETE
  USING (auth.role() = 'authenticated');
