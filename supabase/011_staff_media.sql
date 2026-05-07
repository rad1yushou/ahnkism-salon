-- 011_staff_media.sql
-- スタッフごとの施術画像・動画を管理する staff_media テーブル
-- 実行順序: 010_staff_alter.sql 以降であれば任意
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- staff_media テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_slug  text        NOT NULL,
  media_url   text        NOT NULL,
  media_type  text        NOT NULL DEFAULT 'image'
              CHECK (media_type IN ('image', 'video')),
  alt         text,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE staff_media IS 'スタッフごとの施術画像・動画（最大4件表示）';
COMMENT ON COLUMN staff_media.staff_slug  IS 'staff.slug と対応';
COMMENT ON COLUMN staff_media.media_type  IS '画像: image / 動画: video';
COMMENT ON COLUMN staff_media.media_url   IS 'Supabase Storage: ahnkism-public/staff-media/{staff_slug}/{timestamp}.jpg';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_staff_media_staff_slug
  ON staff_media (staff_slug);

CREATE INDEX IF NOT EXISTS idx_staff_media_sort_order
  ON staff_media (sort_order);


-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_staff_media()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_staff_media ON staff_media;
CREATE TRIGGER set_updated_at_staff_media
  BEFORE UPDATE ON staff_media
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_staff_media();


-- ============================================================
-- RLS 設定
-- ============================================================
ALTER TABLE staff_media ENABLE ROW LEVEL SECURITY;

-- 公開サイト用: is_active=true のみ誰でも読める
CREATE POLICY "staff_media_public_select"
  ON staff_media
  FOR SELECT
  USING (is_active = true);

-- 管理画面用: authenticated は全件参照可
CREATE POLICY "staff_media_auth_select"
  ON staff_media
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ INSERT 可
CREATE POLICY "staff_media_auth_insert"
  ON staff_media
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ UPDATE 可
CREATE POLICY "staff_media_auth_update"
  ON staff_media
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ DELETE 可
CREATE POLICY "staff_media_auth_delete"
  ON staff_media
  FOR DELETE
  USING (auth.role() = 'authenticated');
