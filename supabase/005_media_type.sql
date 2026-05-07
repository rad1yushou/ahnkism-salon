-- 005_media_type.sql
-- hero_slides / pickups に media_type カラムを追加し、Storage バケットを動画対応にする

-- ================================================================
-- 1. hero_slides: media_type カラムを追加（CHECK 制約付き）
-- ================================================================
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CONSTRAINT hero_slides_media_type_check CHECK (media_type IN ('image', 'video'));

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS draft_media_type TEXT
    CONSTRAINT hero_slides_draft_media_type_check CHECK (draft_media_type IN ('image', 'video'));

-- ================================================================
-- 2. pickups: media_type カラムを追加（CHECK 制約付き）
-- ================================================================
ALTER TABLE pickups
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CONSTRAINT pickups_media_type_check CHECK (media_type IN ('image', 'video'));

ALTER TABLE pickups
  ADD COLUMN IF NOT EXISTS draft_media_type TEXT
    CONSTRAINT pickups_draft_media_type_check CHECK (draft_media_type IN ('image', 'video'));

-- ================================================================
-- 3. 既存データ保護: image_url があるレコードは media_type='image' に確定
-- ================================================================
UPDATE hero_slides
  SET media_type = 'image'
  WHERE image_url IS NOT NULL;

UPDATE pickups
  SET media_type = 'image'
  WHERE image_url IS NOT NULL;

-- ================================================================
-- 4. 既存データ保護: draft_image_url があるレコードは draft_media_type='image' に確定
-- ================================================================
UPDATE hero_slides
  SET draft_media_type = 'image'
  WHERE draft_image_url IS NOT NULL;

UPDATE pickups
  SET draft_media_type = 'image'
  WHERE draft_image_url IS NOT NULL;

-- ================================================================
-- 5. Storage バケット: file_size_limit を 50MB に、動画 MIME type を追加
-- ================================================================
UPDATE storage.buckets
SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
WHERE id = 'ahnkism-public';
