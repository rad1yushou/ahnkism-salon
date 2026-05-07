import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getMenuBySlug } from '@/constants/menus';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import MenuDetail from '@/components/sections/MenuDetail';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Supabase を先に確認
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('menus')
      .select('name, description')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      return buildMetadata({
        title: `${data.name}｜大阪・心斎橋の美容室 AHNKISM`,
        description: data.description ?? '',
        path: `/menu/${slug}`,
      });
    }
  }

  // constants にフォールバック
  const constMenu = getMenuBySlug(slug);
  if (constMenu) {
    return buildMetadata({
      title: `${constMenu.name}｜大阪・心斎橋の美容室 AHNKISM`,
      description: constMenu.description,
      path: `/menu/${slug}`,
    });
  }

  // どちらにもない場合は最低限の metadata
  return buildMetadata({
    title: 'メニュー詳細｜大阪・心斎橋の美容室 AHNKISM',
    description: 'AHNKISMグループのメニュー詳細ページです。',
    path: `/menu/${slug}`,
  });
}

export default async function MenuSlugPage({ params }: Props) {
  const { slug } = await params;
  return <MenuDetail slug={slug} />;
}
