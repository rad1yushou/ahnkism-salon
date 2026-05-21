-- 020_recruit_contact.sql
-- 採用問い合わせ先設定テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS recruit_contact_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key    text        NOT NULL UNIQUE DEFAULT 'default',
  title          text        NOT NULL DEFAULT '',
  body           text        NOT NULL DEFAULT '',
  email          text        NOT NULL DEFAULT '',
  phone          text        NOT NULL DEFAULT '',
  line_url       text        NOT NULL DEFAULT '',
  instagram_url  text        NOT NULL DEFAULT '',
  button_label   text        NOT NULL DEFAULT '',
  primary_url    text        NOT NULL DEFAULT '',
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  recruit_contact_settings               IS '採用ページ共通の問い合わせ先設定（通常は setting_key=default の1レコードのみ）';
COMMENT ON COLUMN recruit_contact_settings.setting_key   IS '識別キー（UNIQUE）: default';
COMMENT ON COLUMN recruit_contact_settings.title         IS '見出し（例: 応募・お問い合わせ）';
COMMENT ON COLUMN recruit_contact_settings.body          IS '説明文（改行対応）';
COMMENT ON COLUMN recruit_contact_settings.email         IS 'メールアドレス';
COMMENT ON COLUMN recruit_contact_settings.phone         IS '電話番号';
COMMENT ON COLUMN recruit_contact_settings.line_url      IS 'LINE URL';
COMMENT ON COLUMN recruit_contact_settings.instagram_url IS 'Instagram URL';
COMMENT ON COLUMN recruit_contact_settings.button_label  IS 'ボタン文言（例: 応募・お問い合わせはこちら）';
COMMENT ON COLUMN recruit_contact_settings.primary_url   IS '優先リンク URL（空の場合は mailto:email を使用）';
COMMENT ON COLUMN recruit_contact_settings.is_active     IS 'false の場合は公開ページで非表示（SITE.email にフォールバック）';


-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_recruit_contact()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_recruit_contact ON recruit_contact_settings;
CREATE TRIGGER set_updated_at_recruit_contact
  BEFORE UPDATE ON recruit_contact_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_recruit_contact();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE recruit_contact_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruit_contact_public_select"  ON recruit_contact_settings;
DROP POLICY IF EXISTS "recruit_contact_auth_select"    ON recruit_contact_settings;
DROP POLICY IF EXISTS "recruit_contact_auth_insert"    ON recruit_contact_settings;
DROP POLICY IF EXISTS "recruit_contact_auth_update"    ON recruit_contact_settings;
DROP POLICY IF EXISTS "recruit_contact_auth_delete"    ON recruit_contact_settings;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "recruit_contact_public_select"
  ON recruit_contact_settings
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "recruit_contact_auth_select"
  ON recruit_contact_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "recruit_contact_auth_insert"
  ON recruit_contact_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_contact_auth_update"
  ON recruit_contact_settings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_contact_auth_delete"
  ON recruit_contact_settings
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 初期データ SEED
-- ============================================================
INSERT INTO recruit_contact_settings (
  setting_key, title, body, email, phone,
  line_url, instagram_url, button_label, primary_url, is_active
)
VALUES (
  'default',
  '応募・お問い合わせ',
  'サロン見学・面接希望の方は下記よりご連絡ください。',
  '',
  '',
  '',
  '',
  '応募・お問い合わせはこちら',
  '',
  true
)
ON CONFLICT (setting_key) DO NOTHING;
