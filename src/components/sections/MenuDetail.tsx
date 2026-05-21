import { notFound } from 'next/navigation';
import Image from 'next/image';
import { buildFaqSchema, buildMenuPageSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';
import ReservationCTA from '@/components/ui/ReservationCTA';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
import { getMenuBySlug, type Menu } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type MenuDetailProps = {
  slug: string;
};

function getAspectClass(aspect: string | null): string {
  if (aspect === 'portrait') return 'aspect-[4/5]';
  if (aspect === 'square') return 'aspect-square';
  if (aspect === 'vertical') return 'aspect-[9/16]';
  return 'aspect-video';
}

function getPositionClass(position: string | null): string {
  if (position === 'top') return 'object-top';
  if (position === 'bottom') return 'object-bottom';
  if (position === 'left') return 'object-left';
  if (position === 'right') return 'object-right';
  return 'object-center';
}

export default async function MenuDetail({ slug }: MenuDetailProps) {
  const constMenu = getMenuBySlug(slug);

  let menu: Menu | null = null;
  let menuFoundInDb = false;
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  let mediaAspect: string | null = null;
  let mediaPosition: string | null = null;
  // DBメニューあり → DBを正とするFAQ（0件でも constants に戻さない）
  let dbFaqs: { question: string; answer: string }[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('menus')
      .select('id, slug, name, short_name, description, long_description, price, duration, media_url, media_type, media_aspect, media_position')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      menuFoundInDb = true;
      menu = {
        slug: data.slug,
        name: data.name,
        shortName: data.short_name ?? data.name,
        description: data.description ?? '',
        longDescription: data.long_description ?? '',
        price: data.price ?? '',
        duration: data.duration ?? '',
        faqs: constMenu?.faqs ?? [],
      };
      mediaUrl = data.media_url ?? null;
      mediaType = data.media_type ?? null;
      mediaAspect = data.media_aspect ?? null;
      mediaPosition = data.media_position ?? null;

      // DBメニューが存在する場合は is_active=true のFAQのみ取得
      // 0件でも constants には戻さない（dbFaqs = [] のまま）
      const faqRes = await supabase
        .from('menu_faqs')
        .select('question, answer')
        .eq('menu_id', data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      dbFaqs = faqRes.error ? [] : (faqRes.data ?? []);
    }
  }

  // DB未接続 or DBにメニューなし → constants にフォールバック
  if (!menu && constMenu) {
    menu = constMenu;
  }

  if (!menu) notFound();

  // FAQ決定:
  //   DBメニューあり  → dbFaqs を正とする（0件 = FAQ非表示）
  //   DBメニューなし  → constants FAQ（Supabase未接続 or slug未登録）
  const faqs: { question: string; answer: string }[] = menuFoundInDb
    ? (dbFaqs ?? [])
    : menu.faqs;

  const aspectClass = getAspectClass(mediaAspect);
  const positionClass = getPositionClass(mediaPosition);

  // schema用に faqs を反映したメニューオブジェクト
  const menuForSchema: Menu = { ...menu, faqs };

  return (
    <>
      <JsonLd data={buildMenuPageSchema(menuForSchema)} />
      {faqs.length > 0 && <JsonLd data={buildFaqSchema(faqs)} />}
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: 'メニュー', path: '/menu' },
            { name: menu.name, path: `/menu/${slug}` },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">Menu</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-4">
            {menu.name}
          </h1>
          <div className="flex gap-6 mb-8">
            <div>
              <p className="text-xs tracking-widest text-stone-400 mb-1">料金</p>
              <p className="text-base font-light text-stone-700">{menu.price}</p>
            </div>
            <div>
              <p className="text-xs tracking-widest text-stone-400 mb-1">所要時間</p>
              <p className="text-base font-light text-stone-700">{menu.duration}</p>
            </div>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mb-12">
            {menu.longDescription}
          </p>

          {mediaUrl ? (
            <div
              className={`${aspectClass} bg-stone-100 overflow-hidden relative mb-12`}
              aria-label={`${menu.name}の施術イメージ`}
            >
              {mediaType === 'video' ? (
                <LazyAutoPlayVideo
                  src={mediaUrl}
                  className={`w-full h-full object-cover ${positionClass}`}
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt={`${menu.name}の施術イメージ`}
                  fill
                  className={`object-cover ${positionClass}`}
                  unoptimized
                />
              )}
            </div>
          ) : (
            <div
              className="aspect-video bg-stone-100 flex items-center justify-center text-stone-300 text-xs tracking-widest mb-12"
              aria-label={`${menu.name}の施術イメージ`}
            >
              PHOTO
            </div>
          )}

          {faqs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-light tracking-wider text-stone-800 mb-6">
                よくあるご質問
              </h2>
              <div className="space-y-5">
                {faqs.map((faq, i) => (
                  <details key={i} className="group border border-stone-200 p-5">
                    <summary className="cursor-pointer text-sm text-stone-700 font-light list-none flex justify-between items-center">
                      <span>Q. {faq.question}</span>
                      <span className="text-[#C9A96E] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                    </summary>
                    <p className="mt-4 text-xs text-stone-500 leading-relaxed">
                      A. {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <ReservationCTA />
        </Container>
      </section>
    </>
  );
}
