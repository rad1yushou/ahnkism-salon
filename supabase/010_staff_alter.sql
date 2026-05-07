-- 010_staff_alter.sql
-- 既存 staff テーブルをスタッフ管理CMS用に拡張する
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- カラム追加
-- ============================================================
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS salon_slug       text,
  ADD COLUMN IF NOT EXISTS recommended_menu text,
  ADD COLUMN IF NOT EXISTS tiktok_url       text;

COMMENT ON COLUMN staff.salon_slug         IS 'salons.slug と対応。例: labo / elu / nit / olea';
COMMENT ON COLUMN staff.recommended_menu   IS 'おすすめメニュー（表示用テキスト）';
COMMENT ON COLUMN staff.tiktok_url         IS 'TikTok プロフィール URL';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_salon_slug
  ON staff (salon_slug);

CREATE INDEX IF NOT EXISTS idx_staff_sort_order
  ON staff (sort_order);


-- ============================================================
-- 既存スタッフの salon_slug seed
-- constants/staff.ts の4件に対応
-- ============================================================
UPDATE staff SET salon_slug = 'labo'  WHERE slug = 'yamada-aoi'  AND salon_slug IS NULL;
UPDATE staff SET salon_slug = 'elu'   WHERE slug = 'suzuki-mina' AND salon_slug IS NULL;
UPDATE staff SET salon_slug = 'nit'   WHERE slug = 'tanaka-riko'  AND salon_slug IS NULL;
UPDATE staff SET salon_slug = 'olea'  WHERE slug = 'ito-yuki'    AND salon_slug IS NULL;
