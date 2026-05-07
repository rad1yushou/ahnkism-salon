import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import SalonCard from '@/components/cards/SalonCard';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { SALONS, type Salon } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: '店舗一覧｜大阪・心斎橋・堀江の美容室',
  description: 'AHNKISMグループの店舗一覧。大阪・心斎橋・堀江・本町・北堀江に4店舗展開。各店舗のアクセス・営業時間・スタッフ情報をご覧いただけます。',
  path: '/salon',
});

export default async function SalonListPage() {
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
        <Breadcrumb items={[{ name: '店舗一覧', path: '/salon' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Our Salons"
            title="店舗一覧"
            description="大阪・心斎橋・堀江エリアに4店舗展開しています。お近くのサロンへお気軽にご来店ください。"
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {salons.map((salon) => (
              <SalonCard
                key={salon.slug}
                salon={salon}
                imageUrl={salon.imageUrl}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
