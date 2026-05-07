import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Breadcrumb from '@/components/seo/Breadcrumb';

export const metadata: Metadata = buildMetadata({
  title: 'スタイル一覧｜大阪・心斎橋の美容室 AHNKISM',
  description: 'AHNKISMグループのヘアスタイル一覧。髪質改善・縮毛矯正・韓国ヘア・カラーのビフォーアフターをご覧いただけます。',
  path: '/style',
});

export default function StyleListPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'スタイル一覧', path: '/style' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Style"
            title="スタイル一覧"
            description="施術実績のビフォーアフターをご覧いただけます。（microCMS連携後に自動更新予定）"
            center
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone-100 flex items-center justify-center">
                <span className="text-stone-300 text-xs tracking-widest">PHOTO</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
