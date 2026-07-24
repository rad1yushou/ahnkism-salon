import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getSalonBySlug } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SalonDetail from '@/components/sections/SalonDetail';

export const dynamic = 'force-dynamic';

const SLUG = 'labo';

const SEO_TITLE = '大阪・心斎橋の髪質改善・縮毛矯正美容室｜Labo by AHNKISM';

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

export default function SalonLaboPage() {
  return <SalonDetail slug={SLUG} />;
}
