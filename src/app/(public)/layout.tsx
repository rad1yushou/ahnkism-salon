import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildGroupSchema } from '@/lib/schema';
import { SITE } from '@/constants/site';

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
    </>
  );
}
