import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getSalonBySlug } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SalonDetail from '@/components/sections/SalonDetail';

const SLUG = 'labo';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('salons')
      .select('name, description, nearest_station')
      .eq('slug', SLUG)
      .maybeSingle();

    if (!error && data) {
      return buildMetadata({
        title: `${data.name}｜${data.nearest_station ?? ''}の美容室`,
        description: data.description ?? '',
        path: `/salon/${SLUG}`,
      });
    }
  }

  const salon = getSalonBySlug(SLUG);
  if (salon) {
    return buildMetadata({
      title: `${salon.name}｜${salon.nearestStation}の美容室`,
      description: salon.description,
      path: `/salon/${SLUG}`,
    });
  }

  return buildMetadata({
    title: '店舗詳細｜大阪・心斎橋の美容室 AHNKISM',
    description: 'AHNKISMグループの店舗詳細ページです。',
    path: `/salon/${SLUG}`,
  });
}

export default function SalonLaboPage() {
  return <SalonDetail slug={SLUG} />;
}
