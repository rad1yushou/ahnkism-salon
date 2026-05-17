import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: '採用情報｜美容師・アイリスト求人 AHNKISM大阪',
  description: 'AHNKISMグループの採用情報。大阪・心斎橋・堀江の美容室グループで美容師・アイリスト・アシスタントを募集中。',
  path: '/recruit',
});

// フォールバック用固定データ（Supabase 未設定・接続エラー時のみ使用）
const FALLBACK_JOBS = [
  { href: '/recruit/stylist',   title: 'スタイリスト募集',  desc: '髪質改善・カラーに強いスタイリストを募集しています。経験者歓迎。' },
  { href: '/recruit/assistant', title: 'アシスタント募集',  desc: 'これから技術を身につけたい方を歓迎。丁寧な研修制度があります。' },
  { href: '/recruit/eyelist',   title: 'アイリスト募集',    desc: 'まつ毛エクステの施術スタッフを募集。経験者・未経験者どちらも歓迎。' },
];

type JobItem = {
  slug: string;
  title: string;
  description: string;
};

export default async function RecruitPage() {
  // null = フォールバック、[] = 取得成功0件
  let jobs: JobItem[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    jobs = null;
  } else {
    const { data, error } = await supabase
      .from('recruit_jobs')
      .select('slug, title, description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      jobs = null;
    } else {
      jobs = data ?? [];
    }
  }

  const cards =
    jobs === null
      ? FALLBACK_JOBS.map((j) => ({ href: j.href, title: j.title, desc: j.desc }))
      : jobs.map((j) => ({ href: `/recruit/${j.slug}`, title: j.title, desc: j.description }));

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
          {cards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {cards.map((item) => (
                <div key={item.href} className="border border-stone-200 p-6">
                  <h2 className="text-base font-light tracking-wider text-stone-800 mb-3">{item.title}</h2>
                  <p className="text-xs text-stone-500 leading-relaxed mb-5">{item.desc}</p>
                  <Button href={item.href} variant="outline">詳細を見る</Button>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
