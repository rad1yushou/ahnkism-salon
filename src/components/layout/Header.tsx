'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SITE } from '@/constants/site';
import { getSalonBySlug } from '@/constants/salons';

const NAV_LINKS = [
  { href: '/about', label: 'グループ紹介' },
  { href: '/salon', label: '店舗一覧' },
  { href: '/menu', label: 'メニュー' },
  { href: '/staff', label: 'スタッフ' },
  { href: '/access', label: 'アクセス' },
  { href: '/recruit', label: '採用情報' },
];

function useReservationUrl(): { url: string; external: boolean } {
  const pathname = usePathname();
  const match = pathname.match(/^\/salon\/([^/]+)/);
  if (match) {
    const salon = getSalonBySlug(match[1]);
    if (salon?.hotpepperUrl) return { url: salon.hotpepperUrl, external: true };
  }
  return { url: '/reservation', external: false };
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { url: reservationUrl, external: reservationExternal } = useReservationUrl();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 flex items-center justify-between h-16 sm:h-20">
        {/* Logo */}
        <Link href="/" aria-label={`${SITE.name} トップページ`}>
          <Image
            src="/images/ahnkism-logo-transparent-black.png"
            alt="AHNKISM ロゴ"
            width={130}
            height={40}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest font-light text-stone-700 transition-colors hover:text-[#C9A96E]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href={reservationUrl}
            {...(reservationExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="hidden sm:inline-flex items-center px-5 py-2 text-xs tracking-widest bg-[#C9A96E] text-white hover:bg-[#b8964f] transition-colors"
          >
            ご予約
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-stone-700 transition-colors"
            aria-label="メニューを開く"
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current mb-1.5" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-stone-100 shadow-md">
          <nav className="flex flex-col py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-6 py-3 text-sm tracking-widest text-stone-700 hover:text-[#C9A96E] hover:bg-stone-50 font-light transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-6 pt-3">
              <Link
                href={reservationUrl}
                {...(reservationExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => setMenuOpen(false)}
                className="block text-center py-3 text-sm tracking-widest bg-[#C9A96E] text-white hover:bg-[#b8964f] transition-colors"
              >
                ご予約はこちら
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
