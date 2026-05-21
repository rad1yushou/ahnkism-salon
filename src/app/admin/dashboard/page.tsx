import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'ダッシュボード',
};

type QuickLink = { href: string; label: string; icon: string; desc: string };

const FALLBACK_QUICK_LINKS: QuickLink[] = [
  { href: '/admin/images', label: '画像管理', icon: '🖼', desc: 'ヒーロー・ピックアップ画像の管理' },
  { href: '/admin/salons', label: '店舗管理', icon: '🏠', desc: '店舗情報の編集' },
  { href: '/admin/menus', label: 'メニュー管理', icon: '✂', desc: 'メニュー・料金・FAQの編集' },
  { href: '/admin/staff', label: 'スタッフ管理', icon: '👤', desc: 'スタッフプロフィールの編集' },
  { href: '/admin/reasons', label: '選ばれる理由管理', icon: '★', desc: 'トップページ「選ばれる理由」の編集' },
  { href: '/admin/results', label: '施術実績管理', icon: '◈', desc: 'トップページ「施術実績」の編集' },
  { href: '/admin/home-sections', label: 'ページ構成管理', icon: '☰', desc: 'トップページのセクション表示順・公開設定' },
  { href: '/admin/reviews', label: '口コミ管理', icon: '✦', desc: 'トップページ「口コミ」の編集' },
  { href: '/admin/recruit', label: '採用管理', icon: '✉', desc: '採用職種の掲載・募集要項の編集' },
  { href: '/admin/nav', label: '管理メニュー', icon: '⚙', desc: '管理画面のナビゲーションメニューを管理' },
];

export default async function AdminDashboardPage() {
  let quickLinks = FALLBACK_QUICK_LINKS;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('admin_nav_items')
      .select('href, label, icon, description')
      .eq('is_active', true)
      .neq('nav_key', 'dashboard')
      .order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) {
      quickLinks = data.map((d) => ({
        href: d.href,
        label: d.label,
        icon: d.icon,
        desc: d.description,
      }));
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg tracking-widest text-stone-800 font-light mb-1">ダッシュボード</h1>
      <p className="text-xs text-stone-400 tracking-wider mb-8">AHNKISM 管理画面へようこそ</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-stone-200 p-5 hover:border-stone-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm tracking-wider text-stone-700 group-hover:text-stone-900 transition-colors">
                {item.label}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 tracking-wide">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
