-- 009_salon_menus.sql
-- 店舗別メニュー・料金・画像/動画管理テーブル
-- 実行順序: 001_tables.sql 以降であれば任意
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- salon_menus テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS salon_menus (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug  text        NOT NULL,
  name        text        NOT NULL,
  description text,
  price       text,
  duration    text,
  image_url   text,
  media_type  text        NOT NULL DEFAULT 'image'
              CHECK (media_type IN ('image', 'video')),
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE salon_menus IS '店舗別メニュー・料金情報。salon_slug で salons に紐づく';
COMMENT ON COLUMN salon_menus.salon_slug IS 'salons.slug と対応。例: labo / elu / nit / olea';
COMMENT ON COLUMN salon_menus.media_type IS '画像: image / 動画: video';
COMMENT ON COLUMN salon_menus.image_url  IS 'Supabase Storage: ahnkism-public/salon-menus/{salon_slug}/{timestamp}.jpg';


-- ============================================================
-- インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_salon_menus_salon_slug
  ON salon_menus (salon_slug);

CREATE INDEX IF NOT EXISTS idx_salon_menus_sort_order
  ON salon_menus (sort_order);


-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at_salon_menus()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_salon_menus ON salon_menus;
CREATE TRIGGER set_updated_at_salon_menus
  BEFORE UPDATE ON salon_menus
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at_salon_menus();


-- ============================================================
-- RLS 設定
-- ============================================================
ALTER TABLE salon_menus ENABLE ROW LEVEL SECURITY;

-- 公開サイト用: is_active=true のみ誰でも読める
CREATE POLICY "salon_menus_public_select"
  ON salon_menus
  FOR SELECT
  USING (is_active = true);

-- 管理画面用: authenticated は全件参照可
CREATE POLICY "salon_menus_auth_select"
  ON salon_menus
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ INSERT 可
CREATE POLICY "salon_menus_auth_insert"
  ON salon_menus
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ UPDATE 可
CREATE POLICY "salon_menus_auth_update"
  ON salon_menus
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 管理画面用: authenticated のみ DELETE 可
CREATE POLICY "salon_menus_auth_delete"
  ON salon_menus
  FOR DELETE
  USING (auth.role() = 'authenticated');
