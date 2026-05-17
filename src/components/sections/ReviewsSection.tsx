import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// フォールバック用固定データ（Supabase 未設定・接続エラー時のみ使用）
const REVIEWS = [
  {
    name: 'M.K さん',
    salon: 'AHNKISM labo',
    rating: 5,
    text: '髪質改善トリートメントを初めてお願いしました。今まで縮毛矯正でガチガチになっていたのが嘘のように、ふんわりなめらかな仕上がりに感動しました。',
  },
  {
    name: 'Y.T さん',
    salon: 'AHNKISM elu',
    rating: 5,
    text: '韓国ヘアをお願いしたくて来店。カウンセリングが丁寧で、自分に似合うスタイルを一緒に考えてもらえました。仕上がりも大満足です。',
  },
  {
    name: 'A.N さん',
    salon: 'AHNKISM nit',
    rating: 5,
    text: 'カラーと髪質改善を同日で施術していただきました。色持ちもよく、ツヤツヤが続いています。次回もまたお願いしたいです。',
  },
];

type ReviewItem = {
  id: string;
  display_name: string;
  rating: number;
  body: string;
  menu_label: string;
  salon_label: string;
};

export default async function ReviewsSection() {
  // null = フォールバック、[] = 取得成功0件
  let items: ReviewItem[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    items = null; // Supabase 未設定 → フォールバック
  } else {
    const { data, error } = await supabase
      .from('home_reviews')
      .select('id, display_name, rating, body, menu_label, salon_label')
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
            label="Reviews"
            title="口コミ"
            description="ご来店いただいたお客様の声をご紹介します。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-white p-6 border border-stone-100">
                <div className="flex gap-0.5 mb-3" aria-label={`評価: ${r.rating}点`}>
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <span key={j} className="text-[#C9A96E] text-sm" aria-hidden="true">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">{r.text}</p>
                <div>
                  <p className="text-xs font-light text-stone-700">{r.name}</p>
                  <p className="text-[10px] text-stone-400">{r.salon}</p>
                </div>
              </div>
            ))}
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
          label="Reviews"
          title="口コミ"
          description="ご来店いただいたお客様の声をご紹介します。"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {items.map((item) => {
            const stars = Math.round(item.rating);
            return (
              <div key={item.id} className="bg-white p-6 border border-stone-100">
                <div className="flex gap-0.5 mb-3" aria-label={`評価: ${item.rating}点`}>
                  {Array.from({ length: Math.max(0, Math.min(5, stars)) }).map((_, j) => (
                    <span key={j} className="text-[#C9A96E] text-sm" aria-hidden="true">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">{item.body}</p>
                <div>
                  <p className="text-xs font-light text-stone-700">{item.display_name}</p>
                  {item.salon_label && (
                    <p className="text-[10px] text-stone-400">{item.salon_label}</p>
                  )}
                  {item.menu_label && (
                    <p className="text-[10px] text-stone-300 mt-0.5">{item.menu_label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
