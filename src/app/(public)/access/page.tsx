import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { SALONS, type Salon } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: 'アクセス｜大阪・心斎橋・堀江の美容室 AHNKISM',
  description: 'AHNKISMグループの全店舗アクセス情報。大阪・心斎橋labo・堀江elu・本町nit・北堀江olea の住所・最寄り駅・営業時間。',
  path: '/access',
});

export default async function AccessPage() {
  let salons: Salon[] = SALONS;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('salons')
      .select('slug, name, short_name, description, address, address_postal, address_locality, tel, hours, hours_note, nearest_station, latitude, longitude, google_map_url, hotpepper_url, instagram_url, image_url, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      const supabaseMap = new Map(data.map((r) => [r.slug, r]));
      const allSalons: Salon[] = [];

      for (const r of data.filter((r) => r.is_active)) {
        allSalons.push({
          slug: r.slug,
          name: r.name,
          shortName: r.short_name ?? r.name,
          description: r.description ?? '',
          address: r.address ?? '',
          addressPostal: r.address_postal ?? '',
          addressLocality: r.address_locality ?? '',
          tel: r.tel ?? '',
          hours: r.hours ?? '',
          hoursNote: r.hours_note ?? '',
          nearestStation: r.nearest_station ?? '',
          latitude: r.latitude ?? 0,
          longitude: r.longitude ?? 0,
          googleMapUrl: r.google_map_url ?? '',
          hotpepperUrl: r.hotpepper_url ?? '',
          instagramUrl: r.instagram_url ?? '',
          imageUrl: r.image_url ?? null,
        });
      }

      for (const s of SALONS) {
        if (!supabaseMap.has(s.slug)) allSalons.push(s);
      }

      salons = allSalons;
    }
  }

  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'アクセス', path: '/access' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Access"
            title="アクセス"
            description="AHNKISMグループの全店舗のアクセス情報です。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {salons.map((salon) => (
              <div key={salon.slug} className="border border-stone-200 p-6">
                <p className="text-xs tracking-widest text-[#C9A96E] mb-2 uppercase">
                  {salon.shortName}
                </p>
                <h2 className="text-lg font-light tracking-wider text-stone-800 mb-4">
                  {salon.name}
                </h2>
                <div className="space-y-3 text-sm mb-4">
                  <div>
                    <span className="text-xs text-stone-400 block mb-0.5">住所</span>
                    <span className="text-stone-700 whitespace-pre-line">{salon.address}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block mb-0.5">最寄り駅</span>
                    <span className="text-stone-700 whitespace-pre-line">{salon.nearestStation}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block mb-0.5">営業時間</span>
                    <span className="text-stone-700 whitespace-pre-line">{salon.hours}</span>
                    <span className="text-xs text-stone-400 block whitespace-pre-line">{salon.hoursNote}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block mb-0.5">電話番号</span>
                    <a
                      href={`tel:${salon.tel}`}
                      className="text-stone-700 hover:text-[#C9A96E] transition-colors"
                    >
                      {salon.tel}
                    </a>
                  </div>
                </div>
                {salon.googleMapUrl && (
                  <a
                    href={salon.googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-stone-300 px-4 py-2 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors inline-block"
                  >
                    Googleマップで見る
                  </a>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
