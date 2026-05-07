import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import MenuCard from '@/components/cards/MenuCard';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { MENUS, type Menu } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: 'メニュー・料金一覧｜髪質改善・縮毛矯正・カラー',
  description: 'AHNKISMの全メニュー・料金一覧。髪質改善トリートメント・縮毛矯正・カラー・韓国ヘア・レイヤーカット・まつ毛エクステ。大阪・心斎橋・堀江。',
  path: '/menu',
});

export default async function MenuListPage() {
  let displayMenus: Menu[] = MENUS; // フォールバック

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('menus')
      .select('slug, name, short_name, description, price, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      const supabaseMap = new Map(data.map(r => [r.slug, r]));

      const allMenus: Menu[] = [];

      // Supabase に is_active=true で存在するメニュー（sort_order 順）
      for (const r of data.filter(r => r.is_active)) {
        const constMenu = MENUS.find(m => m.slug === r.slug);
        // Supabase レコードが存在する場合は Supabase の値を正として使う
        // null であっても constants の値には戻さない
        allMenus.push({
          slug: r.slug,
          name: r.name,
          shortName: r.short_name ?? r.name,
          description: r.description ?? '',
          longDescription: constMenu?.longDescription ?? '',
          price: r.price ?? '',
          duration: constMenu?.duration ?? '',
          faqs: constMenu?.faqs ?? [],
        });
      }

      // Supabase に存在しない slug は constants をそのまま使う
      for (const m of MENUS) {
        if (!supabaseMap.has(m.slug)) {
          allMenus.push(m);
        }
      }

      displayMenus = allMenus;
    }
    // error の場合は初期値の MENUS を使う
  }

  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'メニュー', path: '/menu' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Our Menus"
            title="メニュー・料金"
            description="AHNKISMグループの全メニューをご覧いただけます。詳細ページではよくある質問（FAQ）もご確認いただけます。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayMenus.map((menu) => (
              <MenuCard key={menu.slug} menu={menu} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
