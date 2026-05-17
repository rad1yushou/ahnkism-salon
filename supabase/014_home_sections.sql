-- 014_home_sections.sql
-- トップページセクションの表示順・公開管理テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS home_sections (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key  text        UNIQUE NOT NULL,
  label        text        NOT NULL DEFAULT '',
  sort_order   int         NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE home_sections IS 'トップページの管理対象セクション表示順・公開設定';
COMMENT ON COLUMN home_sections.section_key IS 'コンポーネント識別子。例: reasons / salons / menus / beforeAfter / staff';
COMMENT ON COLUMN home_sections.label       IS '管理画面用の表示名';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_home_sections_sort_order
  ON home_sections (sort_order);

CREATE INDEX IF NOT EXISTS idx_home_sections_is_active
  ON home_sections (is_active);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_home_sections()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_home_sections ON home_sections;
CREATE TRIGGER set_updated_at_home_sections
  BEFORE UPDATE ON home_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_home_sections();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_sections_public_select" ON home_sections;
DROP POLICY IF EXISTS "home_sections_auth_select"   ON home_sections;
DROP POLICY IF EXISTS "home_sections_auth_insert"   ON home_sections;
DROP POLICY IF EXISTS "home_sections_auth_update"   ON home_sections;
DROP POLICY IF EXISTS "home_sections_auth_delete"   ON home_sections;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "home_sections_public_select"
  ON home_sections
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "home_sections_auth_select"
  ON home_sections
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "home_sections_auth_insert"
  ON home_sections
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_sections_auth_update"
  ON home_sections
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "home_sections_auth_delete"
  ON home_sections
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 初期データ（SEED）
-- ON CONFLICT DO NOTHING で再実行安全
-- ============================================================
INSERT INTO home_sections (section_key, label, sort_order, is_active) VALUES
  ('reasons',     '選ばれる理由', 1, true),
  ('salons',      '店舗一覧',     2, true),
  ('menus',       '人気メニュー', 3, true),
  ('beforeAfter', '施術実績',     4, true),
  ('staff',       'スタッフ紹介', 5, true)
ON CONFLICT (section_key) DO NOTHING;
