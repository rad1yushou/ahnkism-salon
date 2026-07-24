import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getSalonBySlug } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SalonDetail from '@/components/sections/SalonDetail';

export const dynamic = 'force-dynamic';

const SLUG = 'elu';

const SEO_TITLE = '大阪・堀江の韓国ヘア・髪質改善美容室｜elu by AHNKISM';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('salons')
      .select('description')
      .eq('slug', SLUG)
      .maybeSingle();

    if (!error && data) {
      return buildMetadata({
        title: SEO_TITLE,
        description: data.description ?? '',
        path: `/salon/${SLUG}`,
      });
    }
  }

  const salon = getSalonBySlug(SLUG);
  if (salon) {
    return buildMetadata({
      title: SEO_TITLE,
      description: salon.description,
      path: `/salon/${SLUG}`,
    });
  }

  return buildMetadata({
    title: SEO_TITLE,
    description: 'AHNKISMグループの店舗詳細ページです。',
    path: `/salon/${SLUG}`,
  });
}

export default function SalonEluPage() {
  return <SalonDetail slug={SLUG} />;
}
