-- 012_staff_featured.sql
-- staff テーブルにトップページ掲載フラグと掲載順カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- カラム追加
-- ============================================================
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS is_featured    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order int     NOT NULL DEFAULT 0;

COMMENT ON COLUMN staff.is_featured    IS 'トップページに表示するか。true のスタッフのみ StaffSection に表示される';
COMMENT ON COLUMN staff.featured_order IS 'トップページでの表示順（昇順）。is_featured=true の場合のみ有効';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_is_featured
  ON staff (is_featured);

CREATE INDEX IF NOT EXISTS idx_staff_featured_order
  ON staff (featured_order);
