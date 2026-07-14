-- 048_grant_admin_permissions.sql
-- admin_user_profiles / admin_permissions / admin_nav_items への GRANT 追加
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DROP / DELETE / 既存データ変更なし。GRANT のみ。

-- ============================================================
-- スキーマ使用権限
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- ============================================================
-- admin_user_profiles
-- service_role: Route Handler の CRUD 用（SELECT / INSERT / UPDATE）
-- authenticated: 自分のプロファイル参照用（RLS で自分の行のみ）
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON admin_user_profiles TO service_role;
GRANT SELECT ON admin_user_profiles TO authenticated;

-- ============================================================
-- admin_permissions
-- service_role: Route Handler の CRUD 用（SELECT / INSERT / UPDATE）
-- authenticated: 自分の権限参照用（RLS で自分の行のみ）
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON admin_permissions TO service_role;
GRANT SELECT ON admin_permissions TO authenticated;

-- ============================================================
-- admin_nav_items
-- service_role: Route Handler でのナビ一覧取得用
-- authenticated: layout.tsx でのナビ読み込み用
-- ============================================================
GRANT SELECT ON admin_nav_items TO service_role;
GRANT SELECT ON admin_nav_items TO authenticated;
