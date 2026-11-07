import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getMenuBySlug } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import MenuDetail from '@/components/sections/MenuDetail';

const SLUG = 'kamishitsukaizen';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('menus')
      .select('name, description')
      .eq('slug', SLUG)
      .maybeSingle();

    if (!error && data) {
      return buildMetadata({
        title: `${data.name}｜大阪・心斎橋の美容室`,
        description: data.description ?? '',
        path: `/menu/${SLUG}`,
      });
    }
  }

  const menu = getMenuBySlug(SLUG);
  if (menu) {
    return buildMetadata({
      title: `${menu.name}｜大阪・心斎橋の美容室`,
      description: menu.description,
      path: `/menu/${SLUG}`,
    });
  }

  return buildMetadata({
    title: 'メニュー詳細｜大阪・心斎橋の美容室',
    description: '',
    path: `/menu/${SLUG}`,
  });
}

export default function MenuKamishitsukaizenPage() {
  return <MenuDetail slug={SLUG} />;
}
