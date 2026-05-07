import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Breadcrumb from '@/components/seo/Breadcrumb';

export const metadata: Metadata = buildMetadata({
  title: 'コラム｜髪質改善・ヘアケアの情報 AHNKISM',
  description: '大阪・心斎橋のAHNKISMによるヘアケア・髪質改善のコラム記事。縮毛矯正・カラー・韓国ヘアに関する情報をお届けします。',
  path: '/column',
});

export default function ColumnListPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'コラム', path: '/column' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Column"
            title="コラム"
            description="ヘアケア・髪質改善に関する情報をお届けします。（microCMS連携後に自動更新予定）"
            center
          />
          <p className="text-center text-sm text-stone-400">記事準備中です。</p>
        </Container>
      </section>
    </>
  );
}
