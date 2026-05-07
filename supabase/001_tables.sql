-- ============================================================
-- AHNKISM 管理画面 テーブル定義
-- 実行順序: 001_tables.sql → 002_rls.sql → 003_storage.sql
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- ============================================================


-- ============================================================
-- salons（店舗情報）
-- ============================================================
CREATE TABLE IF NOT EXISTS salons (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text        UNIQUE NOT NULL,         -- 'labo' / 'elu' / 'nit' / 'olea'
  name              text        NOT NULL,                -- 'AHNKISM labo'
  short_name        text        NOT NULL,                -- 'labo'
  description       text,
  address           text,
  address_postal    text,
  address_locality  text,
  tel               text,
  hours             text,
  hours_note        text,
  nearest_station   text,
  latitude          float8,
  longitude         float8,
  google_map_url    text,
  hotpepper_url     text,
  instagram_url     text,
  image_url         text,                                -- Supabase Storage URL（将来用）
  sort_order        int         NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE salons IS 'AHNKISMグループの店舗情報';
COMMENT ON COLUMN salons.slug IS 'URLスラッグ。変更不可（公開URLに影響）';
COMMENT ON COLUMN salons.image_url IS 'Supabase Storage: ahnkism-public/salons/{uuid}.jpg';


-- ============================================================
-- menus（メニュー・料金）
-- ============================================================
CREATE TABLE IF NOT EXISTS menus (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        UNIQUE NOT NULL,          -- 'kamishitsukaizen' など
  name             text        NOT NULL,
  short_name       text,
  description      text,
  long_description text,
  price            text,                                 -- '¥15,000〜'（表示用文字列）
  duration         text,                                 -- '約2〜3時間'
  category         text,                                 -- 将来的なカテゴリ分類用
  image_url        text,                                 -- Supabase Storage URL
  meta_title       text,                                 -- SEO title
  meta_description text,                                 -- SEO description
  sort_order       int         NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE menus IS 'メニュー・料金情報';
COMMENT ON COLUMN menus.image_url IS 'Supabase Storage: ahnkism-public/menus/{uuid}.jpg';


-- ============================================================
-- menu_salons（メニュー ↔ 店舗 中間テーブル）
-- 将来：特定メニューが対応する店舗を管理
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_salons (
  menu_id   uuid NOT NULL REFERENCES menus(id)  ON DELETE CASCADE,
  salon_id  uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_id, salon_id)
);

COMMENT ON TABLE menu_salons IS 'メニューと対応店舗の中間テーブル';


-- ============================================================
-- menu_faqs（メニューのFAQ）
-- 1メニューに対して複数FAQを持てる
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_faqs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id    uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  question   text NOT NULL,
  answer     text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

COMMENT ON TABLE menu_faqs IS 'メニュー別FAQ。menu_id で menus に紐づく';


-- ============================================================
-- staff（スタッフ情報）
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        UNIQUE NOT NULL,
  name             text        NOT NULL,
  name_kana        text,
  role             text,
  salon_id         uuid        REFERENCES salons(id),   -- 所属店舗
  bio              text,
  specialties      text[]      NOT NULL DEFAULT '{}',   -- ['髪質改善', 'カラー']
  instagram_url    text,
  booking_url      text,                                -- 指名予約URL
  image_url        text,                                -- Supabase Storage URL
  meta_title       text,
  meta_description text,
  sort_order       int         NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE staff IS 'スタッフ情報。salon_id で salons に紐づく';
COMMENT ON COLUMN staff.specialties IS '得意技術タグ配列: {''髪質改善'',''カラー''}';
COMMENT ON COLUMN staff.image_url IS 'Supabase Storage: ahnkism-public/staff/{uuid}.jpg';


-- ============================================================
-- hero_slides（トップページ Heroスライダー）
-- ============================================================
CREATE TABLE IF NOT EXISTS hero_slides (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  text        NOT NULL,
  alt        text        NOT NULL DEFAULT '',            -- アクセシビリティ必須
  label      text,                                      -- 管理画面用メモ
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hero_slides IS 'トップページ Heroスライダー画像（最大4枚推奨）';
COMMENT ON COLUMN hero_slides.image_url IS 'Supabase Storage: ahnkism-public/hero/{uuid}.jpg';
COMMENT ON COLUMN hero_slides.alt IS 'img alt 属性。SEO・アクセシビリティのため必須';


-- ============================================================
-- pickups（トップページ Pickup 4枚）
-- ============================================================
CREATE TABLE IF NOT EXISTS pickups (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  text        NOT NULL,
  alt        text        NOT NULL DEFAULT '',
  label      text,                                      -- '髪質改善' / '艶髪カラー' など
  link_href  text,                                      -- クリック先URL（例: /menu/kamishitsukaizen）
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE pickups IS 'トップページ Pickup枠（4枠固定）';
COMMENT ON COLUMN pickups.image_url IS 'Supabase Storage: ahnkism-public/pickup/{uuid}.jpg';
COMMENT ON COLUMN pickups.link_href IS 'クリック時の遷移先。例: /menu/kamishitsukaizen';


-- ============================================================
-- updated_at 自動更新 trigger
-- updated_at カラムを持つ全テーブルに適用
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- salons
DROP TRIGGER IF EXISTS set_updated_at_salons ON salons;
CREATE TRIGGER set_updated_at_salons
  BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- menus
DROP TRIGGER IF EXISTS set_updated_at_menus ON menus;
CREATE TRIGGER set_updated_at_menus
  BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- staff
DROP TRIGGER IF EXISTS set_updated_at_staff ON staff;
CREATE TRIGGER set_updated_at_staff
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
