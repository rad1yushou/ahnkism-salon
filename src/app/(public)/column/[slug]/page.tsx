import type { Metadata } from 'next';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `コラム詳細｜AHNKISM`,
    description: `AHNKISMグループのヘアケアコラム詳細ページ。`,
    alternates: { canonical: `https://ahnkism-salon.com/column/${slug}` },
  };
}

export default async function ColumnDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: 'コラム', path: '/column' },
            { name: 'コラム詳細', path: `/column/${slug}` },
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
