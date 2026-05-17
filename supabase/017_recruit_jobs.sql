-- 017_recruit_jobs.sql
-- 採用情報 CMS テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS recruit_jobs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        NOT NULL UNIQUE,
  title        text        NOT NULL DEFAULT '',
  role_label   text        NOT NULL DEFAULT '',
  description  text        NOT NULL DEFAULT '',
  requirements jsonb       NOT NULL DEFAULT '[]',
  sort_order   int         NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE recruit_jobs IS '採用情報の職種一覧';
COMMENT ON COLUMN recruit_jobs.slug         IS 'URL用スラッグ（例: stylist / eyelist / assistant / reception）';
COMMENT ON COLUMN recruit_jobs.title        IS '表示タイトル（例: スタイリスト募集）';
COMMENT ON COLUMN recruit_jobs.role_label   IS '職種ラベル（例: スタイリスト）';
COMMENT ON COLUMN recruit_jobs.description  IS '職種の説明文';
COMMENT ON COLUMN recruit_jobs.requirements IS '募集要項: [{"label": "給与", "value": "月給25万円〜"}, ...]';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recruit_jobs_sort_order
  ON recruit_jobs (sort_order);

CREATE INDEX IF NOT EXISTS idx_recruit_jobs_is_active
  ON recruit_jobs (is_active);

CREATE INDEX IF NOT EXISTS idx_recruit_jobs_slug
  ON recruit_jobs (slug);


-- ============================================================
-- updated_at 自動更新 trigger（専用関数）
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_recruit_jobs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_recruit_jobs ON recruit_jobs;
CREATE TRIGGER set_updated_at_recruit_jobs
  BEFORE UPDATE ON recruit_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_recruit_jobs();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE recruit_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruit_jobs_public_select" ON recruit_jobs;
DROP POLICY IF EXISTS "recruit_jobs_auth_select"   ON recruit_jobs;
DROP POLICY IF EXISTS "recruit_jobs_auth_insert"   ON recruit_jobs;
DROP POLICY IF EXISTS "recruit_jobs_auth_update"   ON recruit_jobs;
DROP POLICY IF EXISTS "recruit_jobs_auth_delete"   ON recruit_jobs;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "recruit_jobs_public_select"
  ON recruit_jobs
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "recruit_jobs_auth_select"
  ON recruit_jobs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "recruit_jobs_auth_insert"
  ON recruit_jobs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_jobs_auth_update"
  ON recruit_jobs
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "recruit_jobs_auth_delete"
  ON recruit_jobs
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 初期データ SEED
-- ============================================================
INSERT INTO recruit_jobs (slug, title, role_label, description, requirements, sort_order, is_active)
VALUES
  (
    'stylist',
    'スタイリスト募集',
    'スタイリスト',
    '大阪・心斎橋のAHNKISMグループのスタイリスト求人。髪質改善・縮毛矯正・カラーが得意なスタイリスト募集中。',
    '[
      {"label": "雇用形態", "value": "正社員・業務委託（応相談）"},
      {"label": "勤務地", "value": "大阪・心斎橋・堀江エリアの各店舗（希望考慮）"},
      {"label": "給与", "value": "月給25万円〜（経験・スキルにより優遇）"},
      {"label": "勤務時間", "value": "10:00〜19:00（シフト制）"},
      {"label": "休日", "value": "完全週休2日制"},
      {"label": "福利厚生", "value": "社会保険完備 / 賞与あり / 昇給あり"},
      {"label": "教育制度", "value": "OJT / 技術チェック / 薬剤知識"}
    ]'::jsonb,
    1,
    true
  ),
  (
    'eyelist',
    'アイリスト募集',
    'アイリスト',
    '大阪・心斎橋のAHNKISMグループのアイリスト求人。まつ毛エクステの施術スタッフを募集。経験者・未経験者どちらも歓迎。',
    '[
      {"label": "雇用形態", "value": "正社員・業務委託（応相談）"},
      {"label": "勤務地", "value": "大阪・心斎橋・堀江エリアの各店舗（希望考慮）"},
      {"label": "給与", "value": "月給22万円〜（経験・スキルにより優遇）"},
      {"label": "勤務時間", "value": "10:00〜19:00（シフト制）"},
      {"label": "休日", "value": "完全週休2日制"},
      {"label": "福利厚生", "value": "社会保険完備 / 賞与あり / 昇給あり"},
      {"label": "教育制度", "value": "未経験者研修あり / OJT / 技術サポート"}
    ]'::jsonb,
    2,
    true
  ),
  (
    'assistant',
    'アシスタント募集',
    'アシスタント',
    '大阪・心斎橋のAHNKISMグループのアシスタント求人。これから技術を身につけたい方を歓迎。丁寧な研修制度があります。',
    '[
      {"label": "雇用形態", "value": "正社員"},
      {"label": "勤務地", "value": "大阪・心斎橋・堀江エリアの各店舗（希望考慮）"},
      {"label": "給与", "value": "月給18万円〜"},
      {"label": "勤務時間", "value": "10:00〜19:00（シフト制）"},
      {"label": "休日", "value": "完全週休2日制"},
      {"label": "福利厚生", "value": "社会保険完備 / 賞与あり / 昇給あり"},
      {"label": "教育制度", "value": "段階的スキルアップ制度 / 薬剤知識 / 技術チェック"}
    ]'::jsonb,
    3,
    true
  ),
  (
    'reception',
    'レセプション募集',
    'レセプション',
    'AHNKISMグループの受付・レセプションスタッフを募集しています。接客が好きな方、歓迎します。',
    '[
      {"label": "雇用形態", "value": "正社員・パート（応相談）"},
      {"label": "勤務地", "value": "大阪・心斎橋・堀江エリアの各店舗（希望考慮）"},
      {"label": "給与", "value": "月給20万円〜（経験により優遇）"},
      {"label": "勤務時間", "value": "10:00〜19:00（シフト制）"},
      {"label": "休日", "value": "完全週休2日制"},
      {"label": "福利厚生", "value": "社会保険完備 / 賞与あり / 昇給あり"}
    ]'::jsonb,
    4,
    false
  )
ON CONFLICT (slug) DO NOTHING;
