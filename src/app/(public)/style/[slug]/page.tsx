import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `スタイル詳細｜AHNKISM`,
    description: `AHNKISMグループの施術スタイル詳細ページ。`,
    alternates: { canonical: `https://ahnkism-salon.com/style/${slug}` },
  };
}

export default async function StyleDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: 'スタイル一覧', path: '/style' },
            { name: 'スタイル詳細', path: `/style/${slug}` },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-sm text-stone-500">
            このページはmicroCMS連携後に自動生成されます。
          </p>
        </Container>
      </section>
    </>
  );
}
