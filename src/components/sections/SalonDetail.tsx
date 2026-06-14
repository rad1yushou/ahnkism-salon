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
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
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

type LpSection = {
  id: string;
  section_type: string;
  title: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  media_aspect: string;
  media_position: string;
  sort_order: number;
};

function getAspectClass(aspect: string): string {
  if (aspect === 'portrait') return 'aspect-[4/5]';
  if (aspect === 'square') return 'aspect-square';
  if (aspect === 'vertical') return 'aspect-[9/16]';
  return 'aspect-video';
}

function getPositionClass(position: string): string {
  if (position === 'top') return 'object-top';
  if (position === 'bottom') return 'object-bottom';
  if (position === 'left') return 'object-left';
  if (position === 'right') return 'object-right';
  return 'object-center';
}

const SECTION_LABEL: Record<string, string> = {
  hero: 'Hero',
  intro: 'About',
  atmosphere: 'Interior',
  technique: 'Technique',
  staff_vibe: 'Staff',
  before_after: 'Before / After',
};

export default async function SalonDetail({ slug }: SalonDetailProps) {
  const constSalon = getSalonBySlug(slug);
  let salon: Salon | null = null;
  let salonLineUrl: string | null = null;
  let salonMenus: SalonMenu[] = [];
  let staff: StaffMember[] = getStaffBySalon(slug);
  let lpSections: LpSection[] = [];

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const [salonRes, menusRes, staffRes, lpRes] = await Promise.all([
      supabase
        .from('salons')
        .select('slug, name, short_name, description, address, address_postal, address_locality, tel, hours, hours_note, nearest_station, latitude, longitude, google_map_url, hotpepper_url, instagram_url, line_url, image_url')
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
      supabase
        .from('salon_lp_sections')
        .select('id, section_type, title, body, media_url, media_type, media_aspect, media_position, sort_order')
        .eq('salon_slug', slug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (!salonRes.error && salonRes.data) {
      const data = salonRes.data;
      salonLineUrl = (data as { line_url?: string | null }).line_url ?? null;
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

    if (!lpRes.error && lpRes.data) {
      lpSections = lpRes.data as LpSection[];
    }
  }

  if (!salon && constSalon) salon = constSalon;
  if (!salon) notFound();

  const heroSection = lpSections.find(s => s.section_type === 'hero');
  const nonHeroSections = lpSections.filter(s => s.section_type !== 'hero');

  return (
    <>
      <JsonLd data={buildSalonSchema(salon)} />

      {/* ── ヒーロー ── */}
      {heroSection?.media_url ? (
        <div className="relative w-full aspect-video sm:h-[70vh] sm:aspect-auto overflow-hidden bg-stone-900">
          {heroSection.media_type === 'video' ? (
            <LazyAutoPlayVideo
              src={heroSection.media_url}
              className={`w-full h-full object-cover ${getPositionClass(heroSection.media_position)}`}
            />
          ) : (
            <Image
              src={heroSection.media_url}
              alt={salon.name}
              fill
              className={`object-cover ${getPositionClass(heroSection.media_position)}`}
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-6">
            <p className="text-[10px] tracking-[0.3em] text-stone-300 uppercase mb-3">
              {salon.shortName}
            </p>
            <h1 className="text-3xl sm:text-5xl font-light tracking-widest text-white">
              {salon.name}
            </h1>
          </div>
        </div>
      ) : (
        <div className="pt-20">
          <Breadcrumb
            items={[
              { name: '店舗一覧', path: '/salon' },
              { name: salon.name, path: `/salon/${slug}` },
            ]}
          />
        </div>
      )}

      {/* ── イントロ + CTA ── */}
      <section className="py-12 sm:py-16 bg-white">
        <Container narrow>
          {heroSection?.media_url && (
            <div className="mb-6">
              <Breadcrumb
                items={[
                  { name: '店舗一覧', path: '/salon' },
                  { name: salon.name, path: `/salon/${slug}` },
                ]}
              />
            </div>
          )}
          {!heroSection?.media_url && (
            <>
              <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">
                {salon.shortName}
              </p>
              <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-4">
                {salon.name}
              </h1>
            </>
          )}
          {salon.description && (
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line mb-8">
              {salon.description}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {salon.hotpepperUrl && (
              <a
                href={salon.hotpepperUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-wider text-white bg-[#C9A96E] px-5 py-3 hover:bg-[#b8945a] transition-colors"
              >
                HotPepper Beauty で予約
              </a>
            )}
            {salonLineUrl && (
              <a
                href={salonLineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-wider text-white bg-[#06C755] px-5 py-3 hover:bg-[#05b34c] transition-colors"
              >
                LINE で予約
              </a>
            )}
            {salon.instagramUrl && (
              <a
                href={salon.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-3 hover:border-stone-600 transition-colors"
              >
                Instagram
              </a>
            )}
          </div>
        </Container>
      </section>

      {/* ── LP セクション ── */}
      {nonHeroSections.map((sec, i) => {
        const aspectClass = getAspectClass(sec.media_aspect);
        const positionClass = getPositionClass(sec.media_position);
        const label = SECTION_LABEL[sec.section_type] ?? sec.section_type;
        const hasMedia = !!sec.media_url;
        const isEven = i % 2 === 0;

        return (
          <section key={sec.id} className="py-16 sm:py-20 border-t border-stone-100">
            <Container>
              <div
                className={`flex flex-col gap-8 sm:gap-12 items-start${
                  hasMedia
                    ? isEven
                      ? ' sm:flex-row'
                      : ' sm:flex-row-reverse'
                    : ''
                }`}
              >
                {hasMedia && (
                  <div className={`w-full sm:w-2/5 shrink-0 ${aspectClass} bg-stone-100 overflow-hidden relative`}>
                    {sec.media_type === 'video' ? (
                      <LazyAutoPlayVideo
                        src={sec.media_url!}
                        className={`w-full h-full object-cover ${positionClass}`}
                      />
                    ) : (
                      <Image
                        src={sec.media_url!}
                        alt={sec.title || label}
                        fill
                        className={`object-cover ${positionClass}`}
                        unoptimized
                      />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3">
                    {label}
                  </p>
                  {sec.title && (
                    <h2 className="text-xl sm:text-2xl font-light tracking-wider text-stone-800 mb-4">
                      {sec.title}
                    </h2>
                  )}
                  {sec.body && (
                    <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">
                      {sec.body}
                    </p>
                  )}
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* ── 人気メニュー ── */}
      {salonMenus.length > 0 && (
        <section className="py-16 sm:py-20 border-t border-stone-100 bg-stone-50">
          <Container>
            <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3 text-center">Menu</p>
            <h2 className="text-xl font-light tracking-wider text-stone-800 mb-10 text-center">
              人気メニュー
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {salonMenus.map((menu) => (
                <div key={menu.id} className="border border-stone-200 bg-white">
                  <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden flex items-center justify-center">
                    {menu.image_url ? (
                      menu.media_type === 'video' ? (
                        <LazyAutoPlayVideo
                          src={menu.image_url}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={menu.image_url}
                          alt={menu.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )
                    ) : (
                      <span className="text-stone-300 text-xs tracking-widest">PHOTO</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-light tracking-wider text-stone-800 mb-2">
                      {menu.name}
                    </h3>
                    {(menu.price || menu.duration) && (
                      <div className="flex gap-4 mb-2">
                        {menu.price && <p className="text-xs text-stone-600">{menu.price}</p>}
                        {menu.duration && <p className="text-xs text-stone-400">{menu.duration}</p>}
                      </div>
                    )}
                    {menu.description && (
                      <p className="text-xs text-stone-500 leading-relaxed">{menu.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── スタッフ ── */}
      {staff.length > 0 && (
        <section className="py-16 sm:py-20 border-t border-stone-100">
          <Container>
            <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3 text-center">Staff</p>
            <h2 className="text-xl font-light tracking-wider text-stone-800 mb-10 text-center">
              在籍スタッフ
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {staff.map((m) => (
                <StaffCard key={m.slug} member={m} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── アクセス ── */}
      <section className="py-16 sm:py-20 border-t border-stone-100 bg-stone-50">
        <Container>
          <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3 text-center">Access</p>
          <h2 className="text-xl font-light tracking-wider text-stone-800 mb-10 text-center">
            アクセス
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-5">
              {salon.address && (
                <div>
                  <p className="text-xs tracking-widest text-stone-400 mb-1">住所</p>
                  <p className="text-sm text-stone-700 whitespace-pre-line">{salon.address}</p>
                </div>
              )}
              {salon.nearestStation && (
                <div>
                  <p className="text-xs tracking-widest text-stone-400 mb-1">アクセス</p>
                  <p className="text-sm text-stone-700 whitespace-pre-line">{salon.nearestStation}</p>
                </div>
              )}
              {salon.hours && (
                <div>
                  <p className="text-xs tracking-widest text-stone-400 mb-1">営業時間</p>
                  <p className="text-sm text-stone-700 whitespace-pre-line">{salon.hours}</p>
                  {salon.hoursNote && (
                    <p className="text-xs text-stone-400 whitespace-pre-line mt-1">{salon.hoursNote}</p>
                  )}
                </div>
              )}
              {salon.tel && (
                <div>
                  <p className="text-xs tracking-widest text-stone-400 mb-1">電話番号</p>
                  <a
                    href={`tel:${salon.tel}`}
                    className="text-sm text-stone-700 hover:text-[#C9A96E] transition-colors"
                  >
                    {salon.tel}
                  </a>
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-2">
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
                  unoptimized
                />
              ) : (
                'MAP'
              )}
            </div>
          </div>
        </Container>
      </section>

      <ReservationCTA
        href={salon.hotpepperUrl || undefined}
        label={`${salon.name}を予約する`}
        sub="HotPepper Beauty からご予約いただけます"
        external
      />
    </>
  );
}
