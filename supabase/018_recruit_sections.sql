-- 018_recruit_sections.sql
-- 採用ページ本文セクション CMS テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS recruit_sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text        NOT NULL UNIQUE,
  title       text        NOT NULL DEFAULT '',
  body        text        NOT NULL DEFAULT '',
  items       jsonb       NOT NULL DEFAULT '[]',
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE recruit_sections IS '採用ページの本文セクション（会社説明・魅力・教育システムなど）';
COMMENT ON COLUMN recruit_sections.section_key IS '識別キー（UNIQUE）: message / benefits / education / values など';
COMMENT ON COLUMN recruit_sections.title       IS 'セクションタイトル（例: AHNKISMで働く魅力）';
COMMENT ON COLUMN recruit_sections.body        IS '本文テキスト（段落）';
COMMENT ON COLUMN recruit_sections.items       IS '箇条書きリスト: ["社会保険完備", "完全週休2日制", ...]';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recruit_sections_sort_order
  ON recruit_sections (sort_order);

CREATE INDEX IF NOT EXISTS idx_recruit_sections_is_active
  ON recruit_sections (is_active);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_recruit_sections()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_recruit_sections ON recruit_sections;
CREATE TRIGGER set_updated_at_recruit_sections
  BEFORE UPDATE ON recruit_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_recruit_sections();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE recruit_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruit_sections_public_select" ON recruit_sections;
DROP POLICY IF EXISTS "recruit_sections_auth_select"   ON recruit_sections;
DROP POLICY IF EXISTS "recruit_sections_auth_insert"   ON recruit_sections;
DROP POLICY IF EXISTS "recruit_sections_auth_update"   ON recruit_sections;
DROP POLICY IF EXISTS "recruit_sections_auth_delete"   ON recruit_sections;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "recruit_sections_public_select"
  ON recruit_sections
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "recruit_sections_auth_select"
  ON recruit_sections
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "recruit_sections_auth_insert"
  ON recruit_sections
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_sections_auth_update"
  ON recruit_sections
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_sections_auth_delete"
  ON recruit_sections
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 初期データ SEED
-- ============================================================
INSERT INTO recruit_sections (section_key, title, body, items, sort_order, is_active)
VALUES
  (
    'message',
    '採用メッセージ',
    'AHNKISMグループでは、技術と人間性を兼ね備えたスタッフが共に成長できる環境を大切にしています。スタイリスト・アイリスト・アシスタントそれぞれのキャリアを、私たちと一緒に築いていきませんか。あなたの「なりたい自分」を全力でサポートします。',
    '[]'::jsonb,
    1,
    true
  ),
  (
    'benefits',
    'AHNKISMで働く魅力',
    '働きやすい環境と成長できる仕組みを整えています。',
    '["完全週休2日制で働きやすい環境", "社会保険完備・賞与あり・昇給あり", "技術力向上のための勉強会・セミナー参加支援", "大阪・心斎橋・堀江の好立地サロン", "スタッフ同士の距離が近く、チームワーク抜群", "お客様に感謝される接客・技術を磨ける"]'::jsonb,
    2,
    true
  ),
  (
    'education',
    '教育システム',
    '未経験・経験者どちらも安心して働けるよう、段階的な教育システムを用意しています。',
    '["入社後はOJTで基礎から丁寧にサポート", "技術チェックで着実なスキルアップを確認", "薬剤知識・トレンド情報の定期勉強会", "先輩スタイリストによるマンツーマン指導", "外部セミナー・コンテスト参加の推奨・支援"]'::jsonb,
    3,
    true
  ),
  (
    'values',
    '大切にしていること',
    '私たちが大切にしているのは、「お客様の笑顔」と「スタッフの成長」です。技術はもちろん、人として成長できる職場を目指しています。仕事に誇りを持ち、チームで高め合える仲間を求めています。',
    '["お客様一人ひとりに真剣に向き合うこと", "仲間を尊重し、助け合う職場文化", "トレンドを追い続ける向上心", "技術と接客の両立"]'::jsonb,
    4,
    true
  )
ON CONFLICT (section_key) DO NOTHING;
