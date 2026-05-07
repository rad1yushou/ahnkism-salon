import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ダッシュボード',
};

const QUICK_LINKS = [
  { href: '/admin/images', label: '画像管理', icon: '🖼', desc: 'ヒーロー・ピックアップ画像の管理' },
  { href: '/admin/salons', label: '店舗管理', icon: '🏠', desc: '店舗情報の編集' },
  { href: '/admin/menus',  label: 'メニュー管理', icon: '✂', desc: 'メニュー・料金・FAQの編集' },
  { href: '/admin/staff',  label: 'スタッフ管理', icon: '👤', desc: 'スタッフプロフィールの編集' },
];

export default function AdminDashboardPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-lg tracking-widest text-stone-800 font-light mb-1">ダッシュボード</h1>
      <p className="text-xs text-stone-400 tracking-wider mb-8">AHNKISM 管理画面へようこそ</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map((item) => (
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
