-- 022_admin_nav_items.sql
-- 管理画面ナビゲーションメニュー設定テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- テーブル定義
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_nav_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nav_key     text        NOT NULL UNIQUE,
  href        text        NOT NULL DEFAULT '',
  label       text        NOT NULL DEFAULT '',
  icon        text        NOT NULL DEFAULT '',
  description text        NOT NULL DEFAULT '',
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  is_locked   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_nav_items             IS '管理画面サイドバー・ダッシュボードのナビゲーションメニュー設定';
COMMENT ON COLUMN admin_nav_items.nav_key     IS '識別キー（UNIQUE）: dashboard / images / salons など';
COMMENT ON COLUMN admin_nav_items.href        IS '遷移先 URL（例: /admin/salons）';
COMMENT ON COLUMN admin_nav_items.label       IS 'サイドバー表示名（例: 店舗管理）';
COMMENT ON COLUMN admin_nav_items.icon        IS 'アイコン文字（絵文字 or テキスト記号）';
COMMENT ON COLUMN admin_nav_items.description IS 'ダッシュボードカードの説明文';
COMMENT ON COLUMN admin_nav_items.is_locked   IS 'true の場合: href 変更不可・削除不可（重要メニュー保護）';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_admin_nav_items_sort_order
  ON admin_nav_items (sort_order);

CREATE INDEX IF NOT EXISTS idx_admin_nav_items_is_active
  ON admin_nav_items (is_active);


-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_admin_nav_items()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_admin_nav_items ON admin_nav_items;
CREATE TRIGGER set_updated_at_admin_nav_items
  BEFORE UPDATE ON admin_nav_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_admin_nav_items();


-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE admin_nav_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_nav_auth_select" ON admin_nav_items;
DROP POLICY IF EXISTS "admin_nav_auth_insert" ON admin_nav_items;
DROP POLICY IF EXISTS "admin_nav_auth_update" ON admin_nav_items;
DROP POLICY IF EXISTS "admin_nav_auth_delete" ON admin_nav_items;

-- 管理: 認証済みは全件参照・追加・更新可
CREATE POLICY "admin_nav_auth_select"
  ON admin_nav_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_nav_auth_insert"
  ON admin_nav_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_nav_auth_update"
  ON admin_nav_items FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 削除: 認証済み かつ is_locked=false のみ許可
CREATE POLICY "admin_nav_auth_delete"
  ON admin_nav_items FOR DELETE
  USING (auth.role() = 'authenticated' AND is_locked = false);


-- ============================================================
-- 初期データ SEED
-- ============================================================
INSERT INTO admin_nav_items (nav_key, href, label, icon, description, sort_order, is_active, is_locked)
VALUES
  ('dashboard',     '/admin/dashboard',    'ダッシュボード',   '▤', '管理画面トップ',                              1,  true, true),
  ('images',        '/admin/images',       '画像管理',         '🖼', 'ヒーロー・ピックアップ画像の管理',            2,  true, true),
  ('salons',        '/admin/salons',       '店舗管理',         '🏠', '店舗情報の編集',                              3,  true, true),
  ('menus',         '/admin/menus',        'メニュー管理',     '✂',  'メニュー・料金・FAQの編集',                   4,  true, true),
  ('staff',         '/admin/staff',        'スタッフ管理',     '👤', 'スタッフプロフィールの編集',                  5,  true, true),
  ('reasons',       '/admin/reasons',      '選ばれる理由',     '★',  'トップページ「選ばれる理由」の編集',          6,  true, true),
  ('results',       '/admin/results',      '施術実績',         '◈',  'トップページ「施術実績」の編集',              7,  true, true),
  ('home_sections', '/admin/home-sections','ページ構成',       '☰',  'トップページのセクション表示順・公開設定',    8,  true, true),
  ('reviews',       '/admin/reviews',      '口コミ管理',       '✦',  'トップページ「口コミ」の編集',                9,  true, true),
  ('recruit',       '/admin/recruit',      '採用管理',         '✉',  '採用職種の掲載・募集要項の編集',              10, true, true),
  ('nav',           '/admin/nav',          '管理メニュー',     '⚙',  '管理画面のナビゲーションメニューを管理',      11, true, true)
ON CONFLICT (nav_key) DO NOTHING;
