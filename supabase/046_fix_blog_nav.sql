-- 046_fix_blog_nav.sql
-- ブログ管理ナビのリンクを /admin/salon-lp から /admin/blogs に修正
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 注意: DELETE / DROP なし。href の UPDATE のみ。

UPDATE admin_nav_items
SET href = '/admin/blogs'
WHERE label = 'ブログ管理'
  AND href = '/admin/salon-lp';
