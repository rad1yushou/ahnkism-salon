import type { Metadata } from 'next';
import Image from 'next/image';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/seo/Breadcrumb';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: '採用情報｜美容師・アイリスト求人 AHNKISM大阪',
  description: 'AHNKISMグループの採用情報。大阪・心斎橋・堀江の美容室グループで美容師・アイリスト・アシスタントを募集中。',
  path: '/recruit',
});

// フォールバック用固定データ（Supabase 未設定・接続エラー時のみ使用）
const FALLBACK_SECTIONS = [
  {
    title: '採用メッセージ',
    body: 'AHNKISMグループでは、技術と人間性を兼ね備えたスタッフが共に成長できる環境を大切にしています。スタイリスト・アイリスト・アシスタントそれぞれのキャリアを、私たちと一緒に築いていきませんか。あなたの「なりたい自分」を全力でサポートします。',
    items: [] as string[],
    media_url: null as string | null,
    media_type: null as string | null,
    media_layout: null as string | null,
    media_aspect: null as string | null,
    media_position: null as string | null,
  },
  {
    title: 'AHNKISMで働く魅力',
    body: '働きやすい環境と成長できる仕組みを整えています。',
    items: [
      '完全週休2日制で働きやすい環境',
      '社会保険完備・賞与あり・昇給あり',
      '技術力向上のための勉強会・セミナー参加支援',
      '大阪・心斎橋・堀江の好立地サロン',
      'スタッフ同士の距離が近く、チームワーク抜群',
    ],
    media_url: null as string | null,
    media_type: null as string | null,
    media_layout: null as string | null,
    media_aspect: null as string | null,
    media_position: null as string | null,
  },
  {
    title: '教育システム',
    body: '未経験・経験者どちらも安心して働けるよう、段階的な教育システムを用意しています。',
    items: [
      '入社後はOJTで基礎から丁寧にサポート',
      '技術チェックで着実なスキルアップを確認',
      '薬剤知識・トレンド情報の定期勉強会',
      '先輩スタイリストによるマンツーマン指導',
    ],
    media_url: null as string | null,
    media_type: null as string | null,
    media_layout: null as string | null,
    media_aspect: null as string | null,
    media_position: null as string | null,
  },
  {
    title: '大切にしていること',
    body: '私たちが大切にしているのは、「お客様の笑顔」と「スタッフの成長」です。技術はもちろん、人として成長できる職場を目指しています。',
    items: [
      'お客様一人ひとりに真剣に向き合うこと',
      '仲間を尊重し、助け合う職場文化',
      'トレンドを追い続ける向上心',
      '技術と接客の両立',
    ],
    media_url: null as string | null,
    media_type: null as string | null,
    media_layout: null as string | null,
    media_aspect: null as string | null,
    media_position: null as string | null,
  },
];

const FALLBACK_JOBS = [
  { href: '/recruit/stylist',   title: 'スタイリスト募集',  desc: '髪質改善・カラーに強いスタイリストを募集しています。経験者歓迎。' },
  { href: '/recruit/assistant', title: 'アシスタント募集',  desc: 'これから技術を身につけたい方を歓迎。丁寧な研修制度があります。' },
  { href: '/recruit/eyelist',   title: 'アイリスト募集',    desc: 'まつ毛エクステの施術スタッフを募集。経験者・未経験者どちらも歓迎。' },
];

type SectionItem = {
  title: string;
  body: string;
  items: string[];
  media_url: string | null;
  media_type: string | null;
  media_layout: string | null;
  media_aspect: string | null;
  media_position: string | null;
};

type JobItem = {
  slug: string;
  title: string;
  description: string;
};

// アスペクト比クラスを返す
function getAspectClass(media_aspect: string | null): string {
  if (media_aspect === 'portrait') return 'aspect-[4/5]';
  if (media_aspect === 'square') return 'aspect-square';
  return 'aspect-video'; // null / 'video' → 16:9
}

// object-position クラスを返す
function getPositionClass(media_position: string | null): string {
  if (media_position === 'top') return 'object-top';
  if (media_position === 'bottom') return 'object-bottom';
  if (media_position === 'left') return 'object-left';
  if (media_position === 'right') return 'object-right';
  return 'object-center'; // null / 'center'
}

export default async function RecruitPage() {
  // null = フォールバック、[] = 取得成功0件
  let sections: SectionItem[] | null = null;
  let jobs: JobItem[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const [secRes, jobRes] = await Promise.all([
      supabase
        .from('recruit_sections')
        .select('title, body, items, media_url, media_type, media_layout, media_aspect, media_position')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('recruit_jobs')
        .select('slug, title, description')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);
    sections = secRes.error ? null : (secRes.data ?? []);
    jobs = jobRes.error ? null : (jobRes.data ?? []);
  }

  const displaySections: SectionItem[] =
    sections === null
      ? FALLBACK_SECTIONS
      : sections.map((s) => ({
          title: s.title,
          body: s.body,
          items: Array.isArray(s.items) ? (s.items as string[]) : [],
          media_url: s.media_url ?? null,
          media_type: s.media_type ?? null,
          media_layout: s.media_layout ?? null,
          media_aspect: s.media_aspect ?? null,
          media_position: s.media_position ?? null,
        }));

  const cards =
    jobs === null
      ? FALLBACK_JOBS.map((j) => ({ href: j.href, title: j.title, desc: j.desc }))
      : jobs.map((j) => ({ href: `/recruit/${j.slug}`, title: j.title, desc: j.description }));

  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: '採用情報', path: '/recruit' }]} />
      </div>

      {/* ページヘッダー */}
      <section className="py-16 sm:py-24 border-b border-stone-100">
        <Container>
          <SectionTitle
            label="Join Us"
            title="採用情報"
            description="AHNKISMグループでは、美容師・アイリストを随時募集しています。"
            center
          />
        </Container>
      </section>

      {/* 採用本文セクション */}
      {displaySections.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container narrow>
            <div className="space-y-14">
              {displaySections.map((sec, i) => {
                const layout = sec.media_layout === 'side' ? 'left' : (sec.media_layout ?? 'top');
                const isSide = (layout === 'left' || layout === 'right') && !!sec.media_url;
                const aspectClass = getAspectClass(sec.media_aspect);
                const positionClass = getPositionClass(sec.media_position);

                const mediaEl = sec.media_url ? (
                  sec.media_type === 'video' ? (
                    <LazyAutoPlayVideo
                      src={sec.media_url}
                      className={`w-full h-full object-cover ${positionClass}`}
                    />
                  ) : (
                    <Image
                      src={sec.media_url}
                      alt={sec.title}
                      fill
                      className={`object-cover ${positionClass}`}
                      unoptimized
                    />
                  )
                ) : null;

                const textEl = (
                  <>
                    {sec.body && (
                      <p className="text-sm text-stone-500 leading-relaxed mb-5 whitespace-pre-line">
                        {sec.body}
                      </p>
                    )}
                    {sec.items.length > 0 && (
                      <ul className="space-y-2">
                        {sec.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-xs text-stone-600">
                            <span className="text-[#C9A96E] mt-0.5 shrink-0">—</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );

                return (
                  <div key={i}>
                    <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-2">
                      0{i + 1}
                    </p>
                    <h2 className="text-xl font-light tracking-wider text-stone-800 mb-4">
                      {sec.title}
                    </h2>
                    {isSide ? (
                      <div className={`flex gap-8 items-start ${layout === 'right' ? 'flex-col-reverse sm:flex-row-reverse' : 'flex-col sm:flex-row'}`}>
                        <div className={`w-full sm:w-2/5 shrink-0 ${aspectClass} bg-stone-100 overflow-hidden relative`}>
                          {mediaEl}
                        </div>
                        <div className="flex-1">{textEl}</div>
                      </div>
                    ) : layout === 'bottom' ? (
                      <>
                        {textEl}
                        {sec.media_url && (
                          <div className={`${aspectClass} bg-stone-100 overflow-hidden relative mt-5`}>
                            {mediaEl}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {sec.media_url && (
                          <div className={`${aspectClass} bg-stone-100 overflow-hidden relative mb-5`}>
                            {mediaEl}
                          </div>
                        )}
                        {textEl}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* 募集職種カード */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <Container>
          <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-2 text-center">
            Open Positions
          </p>
          <h2 className="text-xl font-light tracking-wider text-stone-800 mb-10 text-center">
            募集職種
          </h2>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {cards.map((item) => (
                <div key={item.href} className="border border-stone-200 bg-white p-6">
                  <h3 className="text-base font-light tracking-wider text-stone-800 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed mb-5">{item.desc}</p>
                  <Button href={item.href} variant="outline">詳細を見る</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-stone-400 tracking-wider">
              現在募集中の職種はありません
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
