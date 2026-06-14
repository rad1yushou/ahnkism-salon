-- 028_salon_lp_sections.sql
-- 店舗LP用セクション管理テーブル
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- salons に line_url を追加
-- ============================================================

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS line_url text;

COMMENT ON COLUMN salons.line_url IS 'LINE予約 URL';

-- ============================================================
-- salon_lp_sections テーブル定義
-- ============================================================

CREATE TABLE IF NOT EXISTS salon_lp_sections (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug     text        NOT NULL REFERENCES salons(slug) ON DELETE CASCADE,
  section_type   text        NOT NULL
                             CHECK (section_type IN ('hero', 'atmosphere', 'staff_vibe', 'technique', 'before_after', 'intro')),
  title          text        NOT NULL DEFAULT '',
  body           text        NOT NULL DEFAULT '',
  media_url      text,
  media_type     text        CHECK (media_type IN ('image', 'video')),
  media_aspect   text        NOT NULL DEFAULT 'video'
                             CHECK (media_aspect IN ('video', 'portrait', 'square', 'vertical')),
  media_position text        NOT NULL DEFAULT 'center'
                             CHECK (media_position IN ('center', 'top', 'bottom', 'left', 'right')),
  sort_order     int         NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  salon_lp_sections                IS '店舗LPセクション管理（ヒーロー動画・雰囲気・スタッフ・技術・Before/After・紹介文）';
COMMENT ON COLUMN salon_lp_sections.salon_slug     IS '対象店舗スラッグ（salons.slug）';
COMMENT ON COLUMN salon_lp_sections.section_type   IS 'hero / atmosphere / staff_vibe / technique / before_after / intro';
COMMENT ON COLUMN salon_lp_sections.media_url      IS 'Supabase Storage: ahnkism-public/salons/{slug}/lp/{section_type}/{timestamp}.{ext}';
COMMENT ON COLUMN salon_lp_sections.media_aspect   IS 'メディア比率: video=16:9, portrait=4:5, square=1:1, vertical=9:16';
COMMENT ON COLUMN salon_lp_sections.media_position IS 'メディア表示位置: center/top/bottom/left/right';

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_salon_lp_sections_salon_slug
  ON salon_lp_sections (salon_slug);

CREATE INDEX IF NOT EXISTS idx_salon_lp_sections_sort_order
  ON salon_lp_sections (salon_slug, sort_order);

-- ============================================================
-- updated_at 自動更新 trigger
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_salon_lp_sections ON salon_lp_sections;
CREATE TRIGGER set_updated_at_salon_lp_sections
  BEFORE UPDATE ON salon_lp_sections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE salon_lp_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salon_lp_sections_public_select"  ON salon_lp_sections;
DROP POLICY IF EXISTS "salon_lp_sections_auth_select"    ON salon_lp_sections;
DROP POLICY IF EXISTS "salon_lp_sections_auth_insert"    ON salon_lp_sections;
DROP POLICY IF EXISTS "salon_lp_sections_auth_update"    ON salon_lp_sections;
DROP POLICY IF EXISTS "salon_lp_sections_auth_delete"    ON salon_lp_sections;

-- 公開: is_active=true のみ誰でも読める
CREATE POLICY "salon_lp_sections_public_select"
  ON salon_lp_sections FOR SELECT
  USING (is_active = true);

-- 管理: 認証済みは全件参照・追加・更新・削除可
CREATE POLICY "salon_lp_sections_auth_select"
  ON salon_lp_sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "salon_lp_sections_auth_insert"
  ON salon_lp_sections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "salon_lp_sections_auth_update"
  ON salon_lp_sections FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "salon_lp_sections_auth_delete"
  ON salon_lp_sections FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 初期セクション SEED（冪等: 既存データがない場合のみ INSERT）
-- ============================================================

-- labo
INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT slug, section_type, title, body, sort_order, true
FROM (VALUES
  ('labo', 'hero',        'AHNKISM labo',       '', 1),
  ('labo', 'intro',       'サロン紹介',           '', 2),
  ('labo', 'atmosphere',  '店内の雰囲気',         '', 3),
  ('labo', 'technique',   'おすすめ技術',         '', 4),
  ('labo', 'staff_vibe',  'スタッフの雰囲気',     '', 5),
  ('labo', 'before_after','Before / After',       '', 6)
) AS v(slug, section_type, title, body, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'labo'
);

-- nit
INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT slug, section_type, title, body, sort_order, true
FROM (VALUES
  ('nit', 'hero',        'AHNKISM nit',        '', 1),
  ('nit', 'intro',       'サロン紹介',           '', 2),
  ('nit', 'atmosphere',  '店内の雰囲気',         '', 3),
  ('nit', 'technique',   'おすすめ技術',         '', 4),
  ('nit', 'staff_vibe',  'スタッフの雰囲気',     '', 5),
  ('nit', 'before_after','Before / After',       '', 6)
) AS v(slug, section_type, title, body, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'nit'
);

-- elu
INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT slug, section_type, title, body, sort_order, true
FROM (VALUES
  ('elu', 'hero',        'AHNKISM elu',        '', 1),
  ('elu', 'intro',       'サロン紹介',           '', 2),
  ('elu', 'atmosphere',  '店内の雰囲気',         '', 3),
  ('elu', 'technique',   'おすすめ技術',         '', 4),
  ('elu', 'staff_vibe',  'スタッフの雰囲気',     '', 5),
  ('elu', 'before_after','Before / After',       '', 6)
) AS v(slug, section_type, title, body, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'elu'
);

-- olea
INSERT INTO salon_lp_sections (salon_slug, section_type, title, body, sort_order, is_active)
SELECT slug, section_type, title, body, sort_order, true
FROM (VALUES
  ('olea', 'hero',        'AHNKISM olea',       '', 1),
  ('olea', 'intro',       'サロン紹介',           '', 2),
  ('olea', 'atmosphere',  '店内の雰囲気',         '', 3),
  ('olea', 'technique',   'おすすめ技術',         '', 4),
  ('olea', 'staff_vibe',  'スタッフの雰囲気',     '', 5),
  ('olea', 'before_after','Before / After',       '', 6)
) AS v(slug, section_type, title, body, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM salon_lp_sections WHERE salon_slug = 'olea'
);

-- ============================================================
-- 管理ナビに追加
-- ============================================================

INSERT INTO admin_nav_items (nav_key, href, label, icon, description, sort_order, is_active, is_locked)
VALUES (
  'salon_lp',
  '/admin/salon-lp',
  '店舗LP',
  '◈',
  '店舗LPセクション（動画・雰囲気・技術など）の管理',
  4,
  true,
  true
)
ON CONFLICT (nav_key) DO NOTHING;
