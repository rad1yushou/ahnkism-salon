-- 037_salon_lp_section_media.sql
-- salon_lp_sections に紐づく複数メディア管理（Before/After など）
-- 実行場所: Supabase ダッシュボード > SQL Editor

CREATE TABLE IF NOT EXISTS salon_lp_section_media (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid        NOT NULL REFERENCES salon_lp_sections(id) ON DELETE CASCADE,
  media_url      text        NOT NULL,
  media_type     text        NOT NULL DEFAULT 'image'
                 CHECK (media_type IN ('image', 'video')),
  media_aspect   text        NOT NULL DEFAULT 'video'
                 CHECK (media_aspect IN ('video', 'portrait', 'square', 'vertical')),
  media_position text        NOT NULL DEFAULT 'center'
                 CHECK (media_position IN ('center', 'top', 'bottom', 'left', 'right')),
  sort_order     int         NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_lp_section_media              IS 'LP セクションに紐づく複数メディア';
COMMENT ON COLUMN salon_lp_section_media.section_id   IS 'salon_lp_sections.id への参照';
COMMENT ON COLUMN salon_lp_section_media.media_aspect IS 'video=16:9 / portrait=4:5 / square=1:1 / vertical=9:16';

CREATE INDEX IF NOT EXISTS idx_salon_lp_section_media_section_id
  ON salon_lp_section_media (section_id, sort_order);

DROP TRIGGER IF EXISTS set_updated_at_salon_lp_section_media ON salon_lp_section_media;
CREATE TRIGGER set_updated_at_salon_lp_section_media
  BEFORE UPDATE ON salon_lp_section_media
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE salon_lp_section_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_lp_section_media_public_select" ON salon_lp_section_media;
DROP POLICY IF EXISTS "salon_lp_section_media_auth_all"      ON salon_lp_section_media;

CREATE POLICY "salon_lp_section_media_public_select"
  ON salon_lp_section_media FOR SELECT
  USING (is_active = true);

CREATE POLICY "salon_lp_section_media_auth_all"
  ON salon_lp_section_media FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
