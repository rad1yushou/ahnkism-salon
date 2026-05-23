-- 027_about_page.sql
-- グループ紹介ページ (/about) のコンテンツ管理テーブル
-- シングルトン運用（1行のみ）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS about_page (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  body           text        NOT NULL DEFAULT '',
  media_url      text,
  media_type     text        CHECK (media_type IN ('image', 'video')),
  media_aspect   text        NOT NULL DEFAULT 'video'
                             CHECK (media_aspect IN ('video', 'portrait', 'square', 'vertical')),
  media_position text        NOT NULL DEFAULT 'center'
                             CHECK (media_position IN ('center', 'top', 'bottom', 'left', 'right')),
  is_active      boolean     NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  about_page                IS 'グループ紹介ページ (/about) コンテンツ（シングルトン）';
COMMENT ON COLUMN about_page.body           IS '本文（改行区切りで複数段落）';
COMMENT ON COLUMN about_page.media_url      IS 'Supabase Storage: ahnkism-public/about/{timestamp}.{ext}';
COMMENT ON COLUMN about_page.media_type     IS 'image または video';
COMMENT ON COLUMN about_page.media_aspect   IS 'メディア比率: video=16:9, portrait=4:5, square=1:1, vertical=9:16';
COMMENT ON COLUMN about_page.media_position IS 'メディア表示位置: center/top/bottom/left/right';
COMMENT ON COLUMN about_page.is_active      IS '公開フラグ。false の場合はフォールバック文言を表示';

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_about_page ON about_page;
CREATE TRIGGER set_updated_at_about_page
  BEFORE UPDATE ON about_page
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "about_page_public_select"  ON about_page;
DROP POLICY IF EXISTS "about_page_auth_select"    ON about_page;
DROP POLICY IF EXISTS "about_page_auth_insert"    ON about_page;
DROP POLICY IF EXISTS "about_page_auth_update"    ON about_page;
DROP POLICY IF EXISTS "about_page_auth_delete"    ON about_page;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "about_page_public_select"
  ON about_page FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "about_page_auth_select"
  ON about_page FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "about_page_auth_insert"
  ON about_page FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "about_page_auth_update"
  ON about_page FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "about_page_auth_delete"
  ON about_page FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 初期レコード（シングルトン・再実行しても複数行にならない）
-- ============================================================

INSERT INTO about_page (body, is_active)
SELECT
  'AHNKISMは、大阪・心斎橋・堀江エリアを中心に展開する髪質改善専門の美容室グループです。「髪が変わると、自分が変わる。」そのコンセプトのもと、お客様一人ひとりの髪質と向き合い、本当に似合うスタイルをご提案します。
酸熱トリートメント・酸性縮毛矯正などの髪質改善技術はもちろん、韓国ヘア・バレイヤージュカラーなど最新トレンドにも対応。ヘアだけでなく、まつ毛エクステのトータルビューティーも得意とするグループです。
スタッフ全員が技術だけでなく、接客・カウンセリングにもこだわり、初めてのお客様でも安心してご来店いただけるサロンづくりを目指しています。',
  true
WHERE NOT EXISTS (SELECT 1 FROM about_page);

-- ============================================================
-- 管理ナビに追加
-- ============================================================

INSERT INTO admin_nav_items (nav_key, href, label, icon, description, sort_order, is_active, is_locked)
VALUES (
  'about',
  '/admin/about',
  'グループ紹介',
  '✦',
  'グループ紹介ページ (/about) の本文・画像の編集',
  12,
  true,
  true
)
ON CONFLICT (nav_key) DO NOTHING;
