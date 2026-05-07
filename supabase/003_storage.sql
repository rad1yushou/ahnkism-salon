-- ============================================================
-- AHNKISM Supabase Storage 設定
-- 実行順序: 001_tables.sql → 002_rls.sql → 003_storage.sql
-- 実行場所: Supabase ダッシュボード > SQL Editor
--
-- バケット構成:
--   ahnkism-public/
--     hero/       Heroスライダー画像
--     pickup/     Pickup 4枚
--     salons/     店舗内装写真
--     menus/      メニュー画像
--     staff/      スタッフ写真
--
-- アクセス方針:
--   読み取り: 誰でも可（公開バケット）
--   書き込み: authenticated ユーザーのみ
--   ファイルサイズ上限: 5MB
--   許可MIME type: image/jpeg, image/png, image/webp, image/gif
-- ============================================================


-- ============================================================
-- バケット作成
-- ============================================================
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'ahnkism-public',
  'ahnkism-public',
  true,                       -- 公開バケット（URL で直接アクセス可）
  5242880,                    -- 5MB 上限（5 * 1024 * 1024）
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;  -- 既にバケットが存在する場合はスキップ


-- ============================================================
-- Storage ポリシー
-- storage.objects テーブルに対して設定
-- ============================================================

-- 公開読み取り: ahnkism-public バケットの全オブジェクトを誰でも参照可
CREATE POLICY "ahnkism_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ahnkism-public');

-- 認証済みのみアップロード可
CREATE POLICY "ahnkism_auth_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ahnkism-public'
    AND auth.role() = 'authenticated'
  );

-- 認証済みのみ更新可（差し替え）
CREATE POLICY "ahnkism_auth_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'ahnkism-public'
    AND auth.role() = 'authenticated'
  );

-- 認証済みのみ削除可
CREATE POLICY "ahnkism_auth_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'ahnkism-public'
    AND auth.role() = 'authenticated'
  );


-- ============================================================
-- 確認クエリ（実行後にバケットが作成されたか確認）
-- ============================================================
-- SELECT id, name, public FROM storage.buckets WHERE id = 'ahnkism-public';
