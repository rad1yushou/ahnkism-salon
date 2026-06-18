-- 036_salon_lp_items.sql
-- 店舗LPセクション項目・メディア管理（雰囲気 / 技術 / ビフォーアフター）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- salon_lp_sections に layout_type カラムを追加
-- ============================================================

ALTER TABLE salon_lp_sections
  ADD COLUMN IF NOT EXISTS layout_type text NOT NULL DEFAULT 'detail'
  CHECK (layout_type IN ('detail', 'pickup'));

COMMENT ON COLUMN salon_lp_sections.layout_type IS '表示形式: detail=項目詳細型 / pickup=ピックアップ型';

-- ============================================================
-- salon_lp_section_items テーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_lp_section_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug  text        NOT NULL,
  section_key text        NOT NULL
              CHECK (section_key IN ('atmosphere', 'technique', 'before_after')),
  title       text,
  description text,
  sort_order  int         NOT NULL DEFAULT 0,
  is_published boolean    NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_lp_section_items              IS '店舗LPセクション内の個別項目';
COMMENT ON COLUMN salon_lp_section_items.salon_slug   IS '店舗スラッグ: labo / nit / elu / olea';
COMMENT ON COLUMN salon_lp_section_items.section_key  IS 'セクション種別: atmosphere / technique / before_after';

CREATE INDEX IF NOT EXISTS idx_salon_lp_section_items_slug_key
  ON salon_lp_section_items (salon_slug, section_key, sort_order);

DROP TRIGGER IF EXISTS set_updated_at_salon_lp_section_items ON salon_lp_section_items;
CREATE TRIGGER set_updated_at_salon_lp_section_items
  BEFORE UPDATE ON salon_lp_section_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE salon_lp_section_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_lp_section_items_public_select" ON salon_lp_section_items;
DROP POLICY IF EXISTS "salon_lp_section_items_auth_all"      ON salon_lp_section_items;

CREATE POLICY "salon_lp_section_items_public_select"
  ON salon_lp_section_items FOR SELECT
  USING (is_published = true);

CREATE POLICY "salon_lp_section_items_auth_all"
  ON salon_lp_section_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- salon_lp_item_media テーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_lp_item_media (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid        NOT NULL REFERENCES salon_lp_section_items(id) ON DELETE CASCADE,
  media_type text        NOT NULL DEFAULT 'image'
             CHECK (media_type IN ('image', 'video')),
  media_role text        NOT NULL DEFAULT 'gallery'
             CHECK (media_role IN ('before', 'after', 'gallery')),
  url        text        NOT NULL,
  alt_text   text,
  sort_order int         NOT NULL DEFAULT 0,
  is_published boolean   NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_lp_item_media            IS '店舗LP項目のメディア（画像・動画）';
COMMENT ON COLUMN salon_lp_item_media.media_role IS 'gallery=通常 / before=ビフォー / after=アフター';

CREATE INDEX IF NOT EXISTS idx_salon_lp_item_media_item_id
  ON salon_lp_item_media (item_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at_salon_lp_item_media ON salon_lp_item_media;
CREATE TRIGGER set_updated_at_salon_lp_item_media
  BEFORE UPDATE ON salon_lp_item_media
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE salon_lp_item_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_lp_item_media_public_select" ON salon_lp_item_media;
DROP POLICY IF EXISTS "salon_lp_item_media_auth_all"      ON salon_lp_item_media;

CREATE POLICY "salon_lp_item_media_public_select"
  ON salon_lp_item_media FOR SELECT
  USING (is_published = true);

CREATE POLICY "salon_lp_item_media_auth_all"
  ON salon_lp_item_media FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
