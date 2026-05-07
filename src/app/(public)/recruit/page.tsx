import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/seo/Breadcrumb';

export const metadata: Metadata = buildMetadata({
  title: '採用情報｜美容師・アイリスト求人 AHNKISM大阪',
  description: 'AHNKISMグループの採用情報。大阪・心斎橋・堀江の美容室グループで美容師・アイリスト・アシスタントを募集中。',
  path: '/recruit',
});

export default function RecruitPage() {
  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: '採用情報', path: '/recruit' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Join Us"
            title="採用情報"
            description="AHNKISMグループでは、美容師・アイリストを随時募集しています。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { href: '/recruit/stylist', title: 'スタイリスト募集', desc: '髪質改善・カラーに強いスタイリストを募集しています。経験者歓迎。' },
              { href: '/recruit/assistant', title: 'アシスタント募集', desc: 'これから技術を身につけたい方を歓迎。丁寧な研修制度があります。' },
              { href: '/recruit/eyelist', title: 'アイリスト募集', desc: 'まつ毛エクステの施術スタッフを募集。経験者・未経験者どちらも歓迎。' },
            ].map((item) => (
              <div key={item.href} className="border border-stone-200 p-6">
                <h2 className="text-base font-light tracking-wider text-stone-800 mb-3">{item.title}</h2>
                <p className="text-xs text-stone-500 leading-relaxed mb-5">{item.desc}</p>
                <Button href={item.href} variant="outline">詳細を見る</Button>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
