-- 041_section_type_custom.sql
-- section_type の CHECK 制約を削除してカスタムセクションを許可
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- CHECK 制約を削除（既存データへの影響なし）
ALTER TABLE salon_lp_sections
  DROP CONSTRAINT IF EXISTS salon_lp_sections_section_type_check;

-- 確認
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'salon_lp_sections'
  AND constraint_type = 'CHECK';
-- → salon_lp_sections_section_type_check が消えていればOK
