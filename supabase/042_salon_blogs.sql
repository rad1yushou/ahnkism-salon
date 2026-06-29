-- 042_salon_blogs.sql
-- ブログ機能のテーブル定義・RLS・ナビ追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- 1. salon_blogs テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS salon_blogs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug         text NOT NULL,
  author_name        text,
  category           text,
  title              text NOT NULL,
  slug               text NOT NULL,
  excerpt            text,
  body               text,
  featured_image_url text,
  is_published       boolean NOT NULL DEFAULT false,
  published_at       timestamptz,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_slug, slug)
);

-- ============================================================
-- 2. salon_blog_media テーブル（本文内メディア用）
-- ============================================================
CREATE TABLE IF NOT EXISTS salon_blog_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id     uuid NOT NULL REFERENCES salon_blogs(id) ON DELETE CASCADE,
  media_url   text NOT NULL,
  media_type  text NOT NULL DEFAULT 'image',
  title       text,
  description text,
  alt         text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RLS の有効化
-- ============================================================
ALTER TABLE salon_blogs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_blog_media ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. salon_blogs ポリシー
-- ============================================================

-- 公開済みのみ public SELECT 可
CREATE POLICY "salon_blogs_public_select"
  ON salon_blogs FOR SELECT
  USING (is_published = true);

-- authenticated は全操作可
CREATE POLICY "salon_blogs_auth_all"
  ON salon_blogs FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 5. salon_blog_media ポリシー
-- ============================================================

-- is_active かつ 親ブログが公開済みのみ public SELECT 可
CREATE POLICY "salon_blog_media_public_select"
  ON salon_blog_media FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM salon_blogs
      WHERE salon_blogs.id = salon_blog_media.blog_id
        AND salon_blogs.is_published = true
    )
  );

-- authenticated は全操作可
CREATE POLICY "salon_blog_media_auth_all"
  ON salon_blog_media FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 6. admin_nav_items にブログ管理を追加
-- ============================================================
INSERT INTO admin_nav_items (nav_key, href, label, icon, sort_order, is_active)
SELECT 'blogs', '/admin/blogs', 'ブログ管理', '✍', 35, true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_nav_items WHERE href = '/admin/blogs'
);

-- ============================================================
-- 確認クエリ
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('salon_blogs', 'salon_blog_media')
ORDER BY table_name;
-- → 2行返ればOK

SELECT policyname, tablename, cmd FROM pg_policies
WHERE tablename IN ('salon_blogs', 'salon_blog_media')
ORDER BY tablename, policyname;
-- → 4ポリシーが返ればOK
