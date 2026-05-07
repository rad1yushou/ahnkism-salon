import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import MenuCard from '@/components/cards/MenuCard';
import Button from '@/components/ui/Button';
import { MENUS, type Menu } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseFeaturedCount(raw: string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(Math.max(Math.round(n), 1), 12);
}

export default async function MenusSection() {
  let featured: Menu[] = MENUS.slice(0, 6); // フォールバック（デフォルト6件）

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const [menusRes, settingsRes] = await Promise.all([
      supabase
        .from('menus')
        .select('slug, name, short_name, description, price, sort_order, is_active')
        .order('sort_order', { ascending: true }),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_menu_count')
        .maybeSingle(),
    ]);

    if (!menusRes.error && menusRes.data) {
      const supabaseMap = new Map(menusRes.data.map(r => [r.slug, r]));
      const count = parseFeaturedCount(settingsRes.data?.value);

      const allMenus: Menu[] = [];

      // Supabase に is_active=true で存在するメニュー（sort_order 順）
      for (const r of menusRes.data.filter(r => r.is_active)) {
        const constMenu = MENUS.find(m => m.slug === r.slug);
        // Supabase レコードが存在する場合は Supabase の値を正として使う
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

      featured = allMenus.slice(0, count);
    }
    // menusRes.error の場合は初期値の MENUS.slice(0, 6) を使う
  }

  return (
    <section className="py-20 sm:py-28 bg-white">
      <Container>
        <SectionTitle
          label="Our Menus"
          title="人気メニュー"
          description="髪質改善・縮毛矯正・カラー・韓国ヘアなど、あなたの理想の髪へ。"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {featured.map((menu) => (
            <MenuCard key={menu.slug} menu={menu} />
          ))}
        </div>
        <div className="text-center">
          <Button href="/menu" variant="outline">
            メニュー一覧を見る
          </Button>
        </div>
      </Container>
    </section>
  );
}
