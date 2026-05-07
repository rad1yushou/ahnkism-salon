import { notFound } from 'next/navigation';
import Image from 'next/image';
import { buildSalonSchema } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';
import ReservationCTA from '@/components/ui/ReservationCTA';
import { getSalonBySlug, SALONS, type Salon } from '@/constants/salons';
import { getStaffBySalon, type StaffMember } from '@/constants/staff';
import StaffCard from '@/components/cards/StaffCard';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type SalonDetailProps = {
  slug: string;
};

type SalonMenu = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  duration: string | null;
  image_url: string | null;
  media_type: 'image' | 'video';
  sort_order: number;
};

export default async function SalonDetail({ slug }: SalonDetailProps) {
  const constSalon = getSalonBySlug(slug);
  let salon: Salon | null = null;
  let salonMenus: SalonMenu[] = [];
  let staff: StaffMember[] = getStaffBySalon(slug); // フォールバック初期値

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const [salonRes, menusRes, staffRes] = await Promise.all([
      supabase
        .from('salons')
        .select('slug, name, short_name, description, address, address_postal, address_locality, tel, hours, hours_note, nearest_station, latitude, longitude, google_map_url, hotpepper_url, instagram_url, image_url')
        .eq('slug', slug)
        .maybeSingle(),
      supabase
        .from('salon_menus')
        .select('id, name, description, price, duration, image_url, media_type, sort_order')
        .eq('salon_slug', slug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('staff')
        .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url, sort_order, is_active')
        .eq('salon_slug', slug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (!salonRes.error && salonRes.data) {
      const data = salonRes.data;
      salon = {
        slug: data.slug,
        name: data.name,
        shortName: data.short_name ?? data.name,
        description: data.description ?? '',
        address: data.address ?? '',
        addressPostal: data.address_postal ?? '',
        addressLocality: data.address_locality ?? '',
        tel: data.tel ?? '',
        hours: data.hours ?? '',
        hoursNote: data.hours_note ?? '',
        nearestStation: data.nearest_station ?? '',
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        googleMapUrl: data.google_map_url ?? '',
        hotpepperUrl: data.hotpepper_url ?? '',
        instagramUrl: data.instagram_url ?? '',
        imageUrl: data.image_url ?? null,
      };
    }

    if (!menusRes.error && menusRes.data) {
      salonMenus = menusRes.data as SalonMenu[];
    }

    if (!staffRes.error && staffRes.data) {
      staff = staffRes.data.map((r) => {
        const salonName = SALONS.find((s) => s.slug === r.salon_slug)?.name ?? r.salon_slug ?? '';
        return {
          slug: r.slug,
          name: r.name,
          nameKana: r.name_kana ?? '',
          role: r.role ?? '',
          salonSlug: r.salon_slug ?? '',
          salonName,
          bio: r.bio ?? '',
          specialties: r.specialties ?? [],
          recommendedMenu: r.recommended_menu ?? undefined,
          instagramUrl: r.instagram_url ?? undefined,
          tiktokUrl: r.tiktok_url ?? undefined,
          bookingUrl: r.booking_url ?? undefined,
          imageUrl: r.image_url ?? undefined,
        };
      });
    }
    // staffRes.error の場合は初期値の getStaffBySalon(slug) を使う
  }

  if (!salon && constSalon) salon = constSalon;
  if (!salon) notFound();

  return (
    <>
      <JsonLd data={buildSalonSchema(salon)} />
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: '店舗一覧', path: '/salon' },
            { name: salon.name, path: `/salon/${slug}` },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">
            {salon.shortName}
          </p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            {salon.name}
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed mb-10 max-w-xl">
            {salon.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div className="space-y-5">
              <div>
                <p className="text-xs tracking-widest text-stone-400 mb-1">住所</p>
                <p className="text-sm text-stone-700">{salon.address}</p>
              </div>
              <div>
                <p className="text-xs tracking-widest text-stone-400 mb-1">アクセス</p>
                <p className="text-sm text-stone-700">{salon.nearestStation}</p>
              </div>
              <div>
                <p className="text-xs tracking-widest text-stone-400 mb-1">営業時間</p>
                <p className="text-sm text-stone-700">{salon.hours}</p>
                <p className="text-xs text-stone-400">{salon.hoursNote}</p>
              </div>
              <div>
                <p className="text-xs tracking-widest text-stone-400 mb-1">電話番号</p>
                <a
                  href={`tel:${salon.tel}`}
                  className="text-sm text-stone-700 hover:text-[#C9A96E] transition-colors"
                >
                  {salon.tel}
                </a>
              </div>
              <div className="flex gap-3 pt-2">
                {salon.googleMapUrl && (
                  <a
                    href={salon.googleMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-stone-300 px-4 py-2 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
                  >
                    Googleマップで見る
                  </a>
                )}
                {salon.hotpepperUrl && (
                  <a
                    href={salon.hotpepperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs border border-stone-300 px-4 py-2 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
                  >
                    HotPepperで予約
                  </a>
                )}
              </div>
            </div>
            <div
              className="aspect-video bg-stone-100 flex items-center justify-center text-stone-300 text-xs tracking-widest relative overflow-hidden"
              aria-label={`${salon.name}の地図`}
            >
              {salon.imageUrl ? (
                <Image
                  src={salon.imageUrl}
                  alt={salon.name}
                  fill
                  className="object-cover"
                />
              ) : (
                'MAP'
              )}
            </div>
          </div>

          {salonMenus.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-light tracking-wider text-stone-800 mb-6">
                メニュー
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {salonMenus.map((menu) => (
                  <div key={menu.id} className="border border-stone-200">
                    <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden flex items-center justify-center">
                      {menu.image_url ? (
                        menu.media_type === 'video' ? (
                          <video
                            src={menu.image_url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={menu.image_url}
                            alt={menu.name}
                            fill
                            className="object-cover"
                          />
                        )
                      ) : (
                        <span className="text-stone-300 text-xs tracking-widest">PHOTO</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-light tracking-wider text-stone-800 mb-2">
                        {menu.name}
                      </h3>
                      {(menu.price || menu.duration) && (
                        <div className="flex gap-4 mb-2">
                          {menu.price && (
                            <p className="text-xs text-stone-600">{menu.price}</p>
                          )}
                          {menu.duration && (
                            <p className="text-xs text-stone-400">{menu.duration}</p>
                          )}
                        </div>
                      )}
                      {menu.description && (
                        <p className="text-xs text-stone-500 leading-relaxed">
                          {menu.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staff.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-light tracking-wider text-stone-800 mb-6">
                在籍スタッフ
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {staff.map((m) => (
                  <StaffCard key={m.slug} member={m} />
                ))}
              </div>
            </div>
          )}

          <ReservationCTA
            href={salon.hotpepperUrl || undefined}
            label={`${salon.name}を予約する`}
            sub="HotPepper Beauty からご予約いただけます"
            external
          />
        </Container>
      </section>
    </>
  );
}
