import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import ReservationCTA from '@/components/ui/ReservationCTA';

export const metadata: Metadata = buildMetadata({
  title: 'グループ紹介｜AHNKISMとは',
  description: 'AHNKISMグループについて。大阪・心斎橋・堀江エリアに4店舗展開する髪質改善専門美容室グループ。コンセプト・こだわり・グループの想いをご紹介します。',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'グループ紹介', path: '/about' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">About</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            AHNKISMとは
          </h1>

          <div className="space-y-8 text-sm text-stone-600 leading-relaxed mb-12">
            <p>
              AHNKISMは、大阪・心斎橋・堀江エリアを中心に展開する髪質改善専門の美容室グループです。
              「髪が変わると、自分が変わる。」そのコンセプトのもと、お客様一人ひとりの髪質と向き合い、
              本当に似合うスタイルをご提案します。
            </p>
            <p>
              酸熱トリートメント・酸性縮毛矯正などの髪質改善技術はもちろん、
              韓国ヘア・バレイヤージュカラーなど最新トレンドにも対応。
              ヘアだけでなく、まつ毛エクステのトータルビューティーも得意とするグループです。
            </p>
            <p>
              スタッフ全員が技術だけでなく、接客・カウンセリングにもこだわり、
              初めてのお客様でも安心してご来店いただけるサロンづくりを目指しています。
            </p>
          </div>

          <div className="aspect-video bg-stone-100 flex items-center justify-center text-stone-300 text-xs tracking-widest mb-12"
            aria-label="AHNKISMグループのサロン内装"
          >
            PHOTO
          </div>

          <ReservationCTA />
        </Container>
      </section>
    </>
  );
}
