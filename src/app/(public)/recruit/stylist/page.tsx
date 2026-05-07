import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import ReservationCTA from '@/components/ui/ReservationCTA';
import { SITE } from '@/constants/site';

export const metadata: Metadata = buildMetadata({
  title: 'スタイリスト募集｜AHNKISM大阪',
  description: '大阪・心斎橋のAHNKISMグループのスタイリスト求人。髪質改善・縮毛矯正・カラーが得意なスタイリスト募集中。',
  path: '/recruit/stylist',
});

export default function RecruitStylistPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: '採用情報', path: '/recruit' },
            { name: 'スタイリスト募集', path: '/recruit/stylist' },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">Recruit</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            スタイリスト募集
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10">
            大阪・心斎橋のAHNKISMグループのスタイリスト求人。髪質改善・縮毛矯正・カラーが得意なスタイリスト募集中。
          </p>
          <div className="space-y-4 text-sm mb-12">
            <div className="border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">雇用形態</p>
              <p className="text-stone-700">正社員・業務委託（応相談）</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">勤務地</p>
              <p className="text-stone-700">大阪・心斎橋・堀江エリアの各店舗（希望考慮）</p>
            </div>
            <div className="border border-stone-200 p-4">
              <p className="text-xs text-stone-400 mb-1">お問い合わせ</p>
              <a href={`mailto:${SITE.email}`} className="text-stone-700 hover:text-[#C9A96E] transition-colors">
                {SITE.email}
              </a>
            </div>
          </div>
          <ReservationCTA label="採用について問い合わせる" sub="メールにてご連絡ください" />
        </Container>
      </section>
    </>
  );
}
