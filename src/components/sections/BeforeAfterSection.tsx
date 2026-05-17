import Image from 'next/image';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import BeforeAfterCard from '@/components/cards/BeforeAfterCard';
import Button from '@/components/ui/Button';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// フォールバック用固定データ（Supabase 未設定・接続エラー時のみ使用）
const SAMPLES = [
  { menuName: '髪質改善トリートメント', alt: 'くせ毛・広がりが改善された仕上がり' },
  { menuName: '縮毛矯正', alt: 'うねり毛がナチュラルなストレートに' },
  { menuName: '韓国ヘア × カラー', alt: 'レイヤーカット＋透明感カラーの仕上がり' },
];

type ResultItem = {
  id: string;
  title: string;
  description: string;
  media_url: string | null;
  media_type: string | null;
};

export default async function BeforeAfterSection() {
  // null = フォールバック、[] = 取得成功0件
  let items: ResultItem[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    items = null; // Supabase 未設定 → フォールバック
  } else {
    const { data, error } = await supabase
      .from('home_results')
      .select('id, title, description, media_url, media_type')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      items = null; // 接続エラー → フォールバック
    } else {
      items = data ?? [];
    }
  }

  // 取得成功・0件 → セクション全体を非表示
  if (items !== null && items.length === 0) {
    return null;
  }

  // フォールバック表示（Supabase 未設定・エラー）
  if (items === null) {
    return (
      <section className="py-20 sm:py-28 bg-stone-50">
        <Container>
          <SectionTitle
            label="Before / After"
            title="施術実績"
            description="実際の施術のビフォーアフターをご覧ください。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            {SAMPLES.map((s, i) => (
              <BeforeAfterCard key={i} menuName={s.menuName} alt={s.alt} />
            ))}
          </div>
          <div className="text-center">
            <Button href="/style" variant="outline">
              スタイル一覧を見る
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  // CMS データ表示
  return (
    <section className="py-20 sm:py-28 bg-stone-50">
      <Container>
        <SectionTitle
          label="Before / After"
          title="施術実績"
          description="実際の施術のビフォーアフターをご覧ください。"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-stone-100 overflow-hidden relative">
                {item.media_url ? (
                  item.media_type === 'video' ? (
                    <LazyAutoPlayVideo
                      src={item.media_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={item.media_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-stone-300 tracking-widest">PHOTO</span>
                  </div>
                )}
              </div>
              <div className="pt-3">
                <p className="text-xs text-stone-400 tracking-widest">{item.title}</p>
                {item.description && (
                  <p className="text-[10px] text-stone-300 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Button href="/style" variant="outline">
            スタイル一覧を見る
          </Button>
        </div>
      </Container>
    </section>
  );
}
