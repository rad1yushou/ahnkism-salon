-- ============================================================
-- AHNKISM RLS（Row Level Security）ポリシー設定
-- 実行順序: 001_tables.sql → 002_rls.sql → 003_storage.sql
-- 実行場所: Supabase ダッシュボード > SQL Editor
--
-- 方針:
--   SELECT : is_active=true のデータは誰でも読める（公開サイト用）
--   INSERT/UPDATE/DELETE : authenticated ユーザーのみ（管理画面用）
--   menu_salons / menu_faqs : is_active なし → SELECT は全件公開
-- ============================================================


-- ============================================================
-- RLS 有効化（全テーブル）
-- ============================================================
ALTER TABLE salons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_faqs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups     ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- salons
-- ============================================================

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "salons_public_select"
  ON salons
  FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・更新・削除・追加可
CREATE POLICY "salons_auth_select"
  ON salons
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "salons_auth_insert"
  ON salons
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "salons_auth_update"
  ON salons
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "salons_auth_delete"
  ON salons
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- menus
-- ============================================================

CREATE POLICY "menus_public_select"
  ON menus
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "menus_auth_select"
  ON menus
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "menus_auth_insert"
  ON menus
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menus_auth_update"
  ON menus
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menus_auth_delete"
  ON menus
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- menu_salons（中間テーブル・is_active なし）
-- SELECT は誰でも読める（親メニューの is_active は呼び出し側で制御）
-- ============================================================

CREATE POLICY "menu_salons_public_select"
  ON menu_salons
  FOR SELECT
  USING (true);

CREATE POLICY "menu_salons_auth_insert"
  ON menu_salons
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_salons_auth_delete"
  ON menu_salons
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- menu_faqs（is_active なし）
-- SELECT は誰でも読める（親メニューの is_active は呼び出し側で制御）
-- ============================================================

CREATE POLICY "menu_faqs_public_select"
  ON menu_faqs
  FOR SELECT
  USING (true);

CREATE POLICY "menu_faqs_auth_insert"
  ON menu_faqs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_faqs_auth_update"
  ON menu_faqs
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "menu_faqs_auth_delete"
  ON menu_faqs
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- staff
-- ============================================================

CREATE POLICY "staff_public_select"
  ON staff
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "staff_auth_select"
  ON staff
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "staff_auth_insert"
  ON staff
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "staff_auth_update"
  ON staff
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "staff_auth_delete"
  ON staff
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- hero_slides
-- ============================================================

CREATE POLICY "hero_slides_public_select"
  ON hero_slides
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "hero_slides_auth_select"
  ON hero_slides
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "hero_slides_auth_insert"
  ON hero_slides
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "hero_slides_auth_update"
  ON hero_slides
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "hero_slides_auth_delete"
  ON hero_slides
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================================================
-- pickups
-- ============================================================

CREATE POLICY "pickups_public_select"
  ON pickups
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "pickups_auth_select"
  ON pickups
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "pickups_auth_insert"
  ON pickups
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pickups_auth_update"
  ON pickups
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pickups_auth_delete"
  ON pickups
  FOR DELETE
  USING (auth.role() = 'authenticated');
