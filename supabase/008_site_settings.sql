-- 008_site_settings.sql
-- サイト全体の設定値を管理するキー・バリューテーブル
-- 実行順序: 001_tables.sql 以降であれば任意
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- site_settings テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'サイト全体の設定値（キー・バリュー形式）';
COMMENT ON COLUMN site_settings.key   IS '設定キー。例: featured_menu_count';
COMMENT ON COLUMN site_settings.value IS '設定値（文字列）。数値も文字列で保存し、アプリ側で変換する';

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION trigger_set_updated_at_site_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_site_settings ON site_settings;
CREATE TRIGGER set_updated_at_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_site_settings();


-- ============================================================
-- RLS 設定
-- ============================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 全員 SELECT 可（公式サイトからも読み取れる）
CREATE POLICY "site_settings_public_select"
  ON site_settings
  FOR SELECT
  USING (true);

-- authenticated のみ INSERT 可
CREATE POLICY "site_settings_auth_insert"
  ON site_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- authenticated のみ UPDATE 可
CREATE POLICY "site_settings_auth_update"
  ON site_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- authenticated のみ DELETE 可
CREATE POLICY "site_settings_auth_delete"
  ON site_settings
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 初期データ
-- ============================================================
INSERT INTO site_settings (key, value)
VALUES
  ('featured_menu_count', '6')
ON CONFLICT (key) DO NOTHING;
