-- 040_section_media_meta_check.sql
-- salon_lp_section_media の title / description 対応確認・RLS補完
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- 1. title / description カラムの存在確認
-- ============================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'salon_lp_section_media'
  AND column_name IN ('title', 'description')
ORDER BY column_name;
-- 結果に2行なければ 039_section_media_meta.sql が未実行

-- ============================================================
-- 2. title / description がある場合のデータ確認
-- ============================================================
SELECT
  slsm.id,
  sls.salon_slug,
  sls.section_type,
  slsm.title,
  slsm.description,
  slsm.is_active
FROM salon_lp_section_media slsm
JOIN salon_lp_sections sls ON sls.id = slsm.section_id
WHERE slsm.title IS NOT NULL OR slsm.description IS NOT NULL
ORDER BY sls.salon_slug, sls.section_type;

-- ============================================================
-- 3. RLS ポリシー確認
-- ============================================================
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'salon_lp_section_media'
ORDER BY policyname;
-- 期待値:
--   salon_lp_section_media_auth_all   : FOR ALL / authenticated
--   salon_lp_section_media_public_select : FOR SELECT / (is_active = true)

-- ============================================================
-- 4. カラムが存在しない場合は先に 039 を実行してから、以下を実行:
-- ============================================================
-- ALTER TABLE salon_lp_section_media
--   ADD COLUMN IF NOT EXISTS title       text,
--   ADD COLUMN IF NOT EXISTS description text;

-- ============================================================
-- 5. authenticated UPDATE policy が存在しない場合の補完
--    (FOR ALL policy が既にあれば不要だが、明示的に追加して安全にする)
-- ============================================================
-- DROP POLICY IF EXISTS "salon_lp_section_media_auth_update" ON salon_lp_section_media;
-- CREATE POLICY "salon_lp_section_media_auth_update"
--   ON salon_lp_section_media FOR UPDATE
--   USING  (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');
