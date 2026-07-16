import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Image from 'next/image';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// フォールバック用定数（Supabase 未設定・接続エラー時のみ使用）
const REASONS_FALLBACK = [
  {
    id: 'fallback-1',
    number_label: '01',
    title: '髪質改善の専門技術',
    description:
      '酸熱トリートメント・酸性縮毛矯正など、最新の髪質改善技術を豊富に用意。あなたの髪質に合わせたベストな施術をご提案します。',
    media_url: null,
    media_type: null,
  },
  {
    id: 'fallback-2',
    number_label: '02',
    title: '大阪4店舗のグループ展開',
    description:
      '心斎橋・堀江・本町・北堀江に4店舗展開。お近くのサロンでいつでもご来店いただけます。',
    media_url: null,
    media_type: null,
  },
  {
    id: 'fallback-3',
    number_label: '03',
    title: 'トレンドに強いスタイリスト',
    description:
      '韓国ヘア・レイヤーカット・バレイヤージュなど、最新トレンドを熟知したスタイリストが在籍。',
    media_url: null,
    media_type: null,
  },
  {
    id: 'fallback-4',
    number_label: '04',
    title: 'ヘア＆まつ毛のワンストップ',
    description:
      '美容室とアイリストが同じグループ内に。ヘアとまつ毛エクステを同日で仕上げることができます。',
    media_url: null,
    media_type: null,
  },
];

type Reason = {
  id: string;
  number_label: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: string | null;
};

export default async function Reasons() {
  let reasons: Reason[] = [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    // Supabase 未設定時のみフォールバック
    reasons = REASONS_FALLBACK;
  } else {
    const { data, error } = await supabase
      .from('home_reasons')
      .select('id, number_label, title, description, media_url, media_type')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      // 接続エラー時のみフォールバック
      reasons = REASONS_FALLBACK;
    } else {
      // 成功時は data をそのまま使う（0件でもフォールバックしない）
      reasons = data ?? [];
    }
  }

  return (
    <section className="py-20 sm:py-28 bg-white">
      <Container>
        <SectionTitle
          label="Why AHNKISM"
          title="選ばれる理由"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
          {reasons.map((r) => (
            <div key={r.id} className="flex flex-col gap-4">
              {r.media_url && (
                <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-stone-100">
                  {r.media_type === 'video' ? (
                    <LazyAutoPlayVideo src={r.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={r.media_url}
                      alt={r.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              )}
              <div className="flex gap-5">
                <span className="text-3xl font-light text-stone-200 tracking-wider leading-none shrink-0 w-10">
                  {r.number_label}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg tracking-wider text-stone-800 font-semibold mb-3">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 leading-relaxed whitespace-pre-line">
                    {r.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
