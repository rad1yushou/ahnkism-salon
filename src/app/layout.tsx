import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
});

// メタデータ・Header・Footer は各 layout に委譲
// (public)/layout.tsx → 公開サイト
// admin/layout.tsx    → 管理画面
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>{children}</body>
    </html>
  );
}
