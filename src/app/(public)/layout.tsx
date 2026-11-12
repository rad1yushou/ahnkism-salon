import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildGroupSchema } from '@/lib/schema';
import Script from 'next/script';
import { SITE } from '@/constants/site';

// GA4: 公開サイトのlayoutのみ・本番環境(VERCEL_ENV=production)のみ有効
const GA_MEASUREMENT_ID = 'G-6C7PVGTLJS';
const ENABLE_GA = process.env.VERCEL_ENV === 'production';

export const metadata: Metadata = {
  title: {
    default: SITE.fullName,
    template: `%s｜${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    siteName: SITE.name,
    locale: SITE.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={buildGroupSchema()} />
      <Header />
      <main className="flex flex-col flex-1 min-h-screen">{children}</main>
      <Footer />
      {ENABLE_GA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
