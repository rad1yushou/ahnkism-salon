-- 047_admin_permissions.sql
-- 管理ユーザープロファイル・ページ権限テーブルを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DROP / DELETE なし。再実行しても安全。

-- ============================================================
-- 1. admin_user_profiles テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_user_profiles (
  user_id      uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text        NOT NULL DEFAULT '',
  is_admin     boolean     NOT NULL DEFAULT false,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_user_profiles              IS '管理画面ユーザーのプロファイル（Supabase Auth と 1:1）';
COMMENT ON COLUMN admin_user_profiles.is_admin     IS 'true = 全管理ページへのフルアクセス権';
COMMENT ON COLUMN admin_user_profiles.is_active    IS 'false = ログイン後も管理画面へアクセス不可';

-- updated_at 自動更新 function（OR REPLACE で安全）
CREATE OR REPLACE FUNCTION trigger_set_updated_at_admin_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーが存在しない場合だけ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_admin_user_profiles'
  ) THEN
    CREATE TRIGGER set_updated_at_admin_user_profiles
      BEFORE UPDATE ON admin_user_profiles
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_admin_user_profiles();
  END IF;
END;
$$;


-- ============================================================
-- 2. admin_permissions テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_permissions (
  id       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid    NOT NULL REFERENCES admin_user_profiles(user_id) ON DELETE CASCADE,
  nav_key  text    NOT NULL REFERENCES admin_nav_items(nav_key)     ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, nav_key)
);

COMMENT ON TABLE  admin_permissions          IS 'ユーザーごとのページ権限（is_admin=true のユーザーには適用しない）';
COMMENT ON COLUMN admin_permissions.nav_key  IS 'admin_nav_items.nav_key と対応';
COMMENT ON COLUMN admin_permissions.can_view IS 'true = 左メニューに表示・ページ閲覧可';
COMMENT ON COLUMN admin_permissions.can_edit IS 'true = 保存・追加・削除などの書き込み操作可';


-- ============================================================
-- 3. RLS 有効化（ALTER TABLE ENABLE RLS は冪等）
-- ============================================================
ALTER TABLE admin_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions   ENABLE ROW LEVEL SECURITY;

-- admin_user_profiles: 自分のレコードだけ SELECT 可
-- INSERT/UPDATE/DELETE ポリシー不設定 → service_role（Route Handler）のみ書き込み可
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_user_profiles'
      AND policyname = 'admin_user_profiles_select_own'
  ) THEN
    CREATE POLICY "admin_user_profiles_select_own"
      ON admin_user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- admin_permissions: 自分のレコードだけ SELECT 可
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_permissions'
      AND policyname = 'admin_permissions_select_own'
  ) THEN
    CREATE POLICY "admin_permissions_select_own"
      ON admin_permissions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END;
$$;


-- ============================================================
-- 4. admin_nav_items に不足 nav_key を追加（重複時は何もしない）
-- 022 の seed にない: salon_lp / blogs / about / users
-- ============================================================
INSERT INTO admin_nav_items (nav_key, href, label, icon, description, sort_order, is_active, is_locked)
VALUES
  ('salon_lp', '/admin/salon-lp', '店舗LP',      '◈', '店舗ランディングページの編集',    4,  true, true),
  ('blogs',    '/admin/blogs',    'ブログ管理',   '✏', 'ブログ記事の投稿・編集',           5,  true, true),
  ('about',    '/admin/about',    'グループ紹介', '✦', 'グループ紹介ページの編集',          12, true, true),
  ('users',    '/admin/users',    'ユーザー管理', '👥','管理ユーザーの追加・権限設定',     13, true, true)
ON CONFLICT (nav_key) DO NOTHING;


-- ============================================================
-- 5. 初期管理者を admin_user_profiles に登録
-- is_admin = true / is_active = true
-- 今後の管理者追加は /admin/users から行う
-- ============================================================
INSERT INTO admin_user_profiles (user_id, display_name, is_admin, is_active)
SELECT id, email, true, true
FROM auth.users
WHERE email = 'rad1yushou@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
