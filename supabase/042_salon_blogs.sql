-- 042_salon_blogs.sql
-- ブログ機能テーブル（IF NOT EXISTS で冪等 / 既存テーブルがあれば何もしない）
-- 実行場所: Supabase ダッシュボード > SQL Editor

-- ============================================================
-- 1. salon_blogs
-- ============================================================
CREATE TABLE IF NOT EXISTS salon_blogs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_slug         text NOT NULL,
  title              text NOT NULL,
  slug               text NOT NULL DEFAULT '',
  category           text,
  author_name        text,
  excerpt            text,
  body               text,
  featured_image_url text,
  is_published       boolean NOT NULL DEFAULT false,
  published_at       timestamptz,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. salon_blog_media
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
-- 3. RLS
-- ============================================================
ALTER TABLE salon_blogs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_blog_media ENABLE ROW LEVEL SECURITY;

-- 公開済みのみ public SELECT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='salon_blogs' AND policyname='salon_blogs_public_select'
  ) THEN
    CREATE POLICY "salon_blogs_public_select"
      ON salon_blogs FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- authenticated は全操作可
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='salon_blogs' AND policyname='salon_blogs_auth_all'
  ) THEN
    CREATE POLICY "salon_blogs_auth_all"
      ON salon_blogs FOR ALL
      USING  (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 親ブログが公開済みかつ is_active=true のみ public SELECT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='salon_blog_media' AND policyname='salon_blog_media_public_select'
  ) THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='salon_blog_media' AND policyname='salon_blog_media_auth_all'
  ) THEN
    CREATE POLICY "salon_blog_media_auth_all"
      ON salon_blog_media FOR ALL
      USING  (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- 確認
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('salon_blogs', 'salon_blog_media')
ORDER BY table_name;
