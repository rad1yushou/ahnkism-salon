import { notFound } from 'next/navigation';
import { buildFaqSchema, buildMenuPageSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';
import ReservationCTA from '@/components/ui/ReservationCTA';
import { getMenuBySlug, type Menu } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type MenuDetailProps = {
  slug: string;
};

export default async function MenuDetail({ slug }: MenuDetailProps) {
  const constMenu = getMenuBySlug(slug);

  // Supabase を先に確認
  let menu: Menu | null = null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('menus')
      .select('slug, name, short_name, description, long_description, price, duration')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      // Supabase レコードあり → Supabase の値を正として使う
      // null でも constants の値には戻さない。faqs のみ constants から取得
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
    }
  }

  // Supabase にない場合は constants にフォールバック
  if (!menu && constMenu) {
    menu = constMenu;
  }

  // Supabase にも constants にもない場合は 404
  if (!menu) notFound();

  return (
    <>
      <JsonLd data={buildMenuPageSchema(menu)} />
      {menu.faqs.length > 0 && <JsonLd data={buildFaqSchema(menu.faqs)} />}
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

          <div className="aspect-video bg-stone-100 flex items-center justify-center text-stone-300 text-xs tracking-widest mb-12"
            aria-label={`${menu.name}の施術イメージ`}
          >
            PHOTO
          </div>

          {menu.faqs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-light tracking-wider text-stone-800 mb-6">
                よくあるご質問
              </h2>
              <div className="space-y-5">
                {menu.faqs.map((faq, i) => (
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
