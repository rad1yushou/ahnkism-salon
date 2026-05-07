import { createSupabaseServerClient } from '@/lib/supabase/server';
import HeroClient, { type HeroSlide, type HeroPickup } from './HeroClient';

export default async function Hero() {
  let slides: HeroSlide[] = [];
  let pickups: HeroPickup[] = [];

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const [slidesRes, pickupsRes] = await Promise.all([
      supabase
        .from('hero_slides')
        .select('image_url, alt, label, media_type')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('pickups')
        .select('image_url, alt, label, link_href, sort_order, media_type')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (slidesRes.error) {
      console.error('[Hero] hero_slides 取得エラー:', slidesRes.error.message);
    } else {
      slides = slidesRes.data ?? [];
    }

    if (pickupsRes.error) {
      console.error('[Hero] pickups 取得エラー:', pickupsRes.error.message);
    } else {
      pickups = pickupsRes.data ?? [];
    }
  }

  return <HeroClient slides={slides} pickups={pickups} />;
}
