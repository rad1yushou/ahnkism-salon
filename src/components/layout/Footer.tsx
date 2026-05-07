import Link from 'next/link';
import Image from 'next/image';
import { SITE, BOOKING_URL } from '@/constants/site';

const FOOTER_LINKS = [
  {
    heading: 'サロン情報',
    links: [
      { href: '/salon/labo', label: 'AHNKISM labo' },
      { href: '/salon/elu', label: 'AHNKISM elu' },
      { href: '/salon/nit', label: 'AHNKISM nit' },
      { href: '/salon/olea', label: 'AHNKISM olea' },
    ],
  },
  {
    heading: 'メニュー',
    links: [
      { href: '/menu/kamishitsukaizen', label: '髪質改善' },
      { href: '/menu/straight', label: '縮毛矯正' },
      { href: '/menu/color', label: 'カラー' },
      { href: '/menu/korean-hair', label: '韓国ヘア' },
      { href: '/menu/eyelash', label: 'まつ毛エクステ' },
    ],
  },
  {
    heading: 'グループ',
    links: [
      { href: '/about', label: 'グループ紹介' },
      { href: '/staff', label: 'スタッフ' },
      { href: '/access', label: 'アクセス' },
      { href: '/contact', label: 'お問い合わせ' },
      { href: '/recruit', label: '採用情報' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 pt-16 pb-8">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4" aria-label={`${SITE.name} トップページ`}>
              <Image
                src="/images/ahnkism-logo-transparent-white.png"
                alt="AHNKISM ロゴ"
                width={120}
                height={36}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <p className="text-xs leading-relaxed text-stone-500 mb-5">
              大阪・心斎橋・堀江エリアの
              <br />
              髪質改善美容室グループ
            </p>
            <div className="flex gap-4">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-widest hover:text-[#C9A96E] transition-colors"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href={SITE.line}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-widest hover:text-[#C9A96E] transition-colors"
                aria-label="LINE"
              >
                LINE
              </a>
            </div>
          </div>

          {/* Nav Groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <p className="text-xs tracking-widest text-stone-500 mb-4 uppercase">
                {group.heading}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs hover:text-[#C9A96E] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Reservation */}
        <div className="border-t border-stone-800 pt-8 mb-8 text-center">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-3 border border-[#C9A96E] text-[#C9A96E] text-xs tracking-widest hover:bg-[#C9A96E] hover:text-white transition-all"
          >
            ご予約はこちら（HotPepper Beauty）
          </a>
        </div>

        {/* Bottom */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-stone-600">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/contact" className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors">
              お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
