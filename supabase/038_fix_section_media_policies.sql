-- 038_fix_section_media_policies.sql
-- salon_lp_section_media の RLS ポリシーを再作成
-- 症状: 管理画面では表示されるが公開サイトに反映されない
-- 原因: anon ロール向け public_select ポリシーが欠落している可能性
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- 現状確認（実行後に結果を確認）
-- ============================================================

-- テーブルにデータがあるか確認
SELECT
  sls.salon_slug,
  sls.section_type,
  sls.is_active  AS section_is_active,
  slsm.id        AS media_id,
  slsm.is_active AS media_is_active,
  slsm.sort_order,
  left(slsm.media_url, 60) AS media_url_preview
FROM salon_lp_section_media slsm
JOIN salon_lp_sections sls ON sls.id = slsm.section_id
ORDER BY sls.salon_slug, sls.section_type, slsm.sort_order;

-- 現在有効な RLS ポリシーを確認
SELECT
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'salon_lp_section_media'
ORDER BY policyname;

-- ============================================================
-- RLS ポリシー再作成
-- ============================================================

ALTER TABLE salon_lp_section_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_lp_section_media_public_select" ON salon_lp_section_media;
DROP POLICY IF EXISTS "salon_lp_section_media_auth_all"      ON salon_lp_section_media;

-- anon・authenticated 両ロールが is_active=true の行を SELECT 可能
CREATE POLICY "salon_lp_section_media_public_select"
  ON salon_lp_section_media FOR SELECT
  USING (is_active = true);

-- authenticated ロールが全操作（INSERT/UPDATE/DELETE を含む）可能
CREATE POLICY "salon_lp_section_media_auth_all"
  ON salon_lp_section_media FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- anon ロールとして読めるか確認（RLS が正しく機能しているか）
-- ============================================================
-- ※ Supabase SQL Editor は postgres ロールで動作するため RLS をバイパスします。
--   実際の anon アクセスは PostgREST 経由で行われます。
--   上記の SELECT クエリで media_is_active = true の行がある場合、
--   公開サイトからも読めるはずです。

-- ============================================================
-- is_active = false になってしまったメディアを一括修復
-- ============================================================
-- 上記の SELECT で media_is_active = false の行があった場合に実行:
-- UPDATE salon_lp_section_media SET is_active = true WHERE is_active = false;
