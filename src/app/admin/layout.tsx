import Link from 'next/link';
import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: {
    default: '管理画面｜AHNKISM',
    template: '%s｜AHNKISM 管理画面',
  },
  robots: {
    index: false,
    follow: false,
  },
};

type NavItem = { nav_key: string; href: string; label: string; icon: string };

const FALLBACK_NAV: NavItem[] = [
  { nav_key: 'dashboard',     href: '/admin/dashboard',     label: 'ダッシュボード', icon: '▤' },
  { nav_key: 'images',        href: '/admin/images',        label: '画像管理',       icon: '🖼' },
  { nav_key: 'salons',        href: '/admin/salons',        label: '店舗管理',       icon: '🏠' },
  { nav_key: 'salon_lp',      href: '/admin/salon-lp',      label: '店舗LP',         icon: '◈' },
  { nav_key: 'blogs',         href: '/admin/blogs',         label: 'ブログ管理',     icon: '✏' },
  { nav_key: 'menus',         href: '/admin/menus',         label: 'メニュー管理',   icon: '✂' },
  { nav_key: 'staff',         href: '/admin/staff',         label: 'スタッフ管理',   icon: '👤' },
  { nav_key: 'reasons',       href: '/admin/reasons',       label: '選ばれる理由',   icon: '★' },
  { nav_key: 'results',       href: '/admin/results',       label: '施術実績',       icon: '◈' },
  { nav_key: 'home_sections', href: '/admin/home-sections', label: 'ページ構成',     icon: '☰' },
  { nav_key: 'reviews',       href: '/admin/reviews',       label: '口コミ管理',     icon: '✦' },
  { nav_key: 'recruit',       href: '/admin/recruit',       label: '採用管理',       icon: '✉' },
  { nav_key: 'about',         href: '/admin/about',         label: 'グループ紹介',   icon: '✦' },
  { nav_key: 'nav',           href: '/admin/nav',           label: '管理メニュー',   icon: '⚙' },
  { nav_key: 'users',         href: '/admin/users',         label: 'ユーザー管理',   icon: '👥' },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let navItems = FALLBACK_NAV;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('admin_nav_items')
      .select('nav_key, href, label, icon')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) {
      navItems = data as NavItem[];
    }

    // 権限フィルタリング（/admin/login はセッションなしで通るため user null チェック必須）
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('admin_user_profiles')
        .select('is_admin, is_active')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_active && profile?.is_admin) {
        // is_admin=true かつ is_active=true → navItems そのまま全表示
      } else {
        // profile なし・is_active=false・非管理者・権限取得失敗
        // → can_view のあるページのみ表示（dashboard は常に表示、users は非表示）
        const { data: perms } = await supabase
          .from('admin_permissions')
          .select('nav_key, can_view')
          .eq('user_id', user.id);

        const allowedKeys = new Set(
          (perms ?? []).filter(p => p.can_view).map(p => p.nav_key)
        );

        navItems = navItems.filter(item => {
          if (item.nav_key === 'dashboard') return true;
          if (item.nav_key === 'users') return false;
          return allowedKeys.has(item.nav_key);
        });
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-50 font-sans">
      {/* サイドバー */}
      <aside className="w-52 shrink-0 bg-stone-900 text-stone-300 flex flex-col">
        {/* ロゴ */}
        <div className="px-5 py-5 border-b border-stone-700">
          <p className="text-xs tracking-[0.3em] text-stone-400 mb-0.5">AHNKISM</p>
          <p className="text-[10px] tracking-widest text-stone-600">管理画面</p>
        </div>

        {/* ナビ */}
        <nav className="flex-1 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.nav_key}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-2.5 text-xs tracking-wider hover:bg-stone-800 hover:text-white transition-colors"
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-stone-700 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="block text-[10px] text-stone-600 hover:text-stone-400 tracking-wider transition-colors"
          >
            ← 公開サイトを見る
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-[10px] text-stone-600 hover:text-stone-400 tracking-wider transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
