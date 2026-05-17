import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import StaffCard from '@/components/cards/StaffCard';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SALONS } from '@/constants/salons';
import { STAFF, type StaffMember } from '@/constants/staff';

export const metadata: Metadata = buildMetadata({
  title: 'ご予約',
  description: '店舗またはスタッフからご予約方法をお選びください。AHNKISM グループ 大阪・心斎橋・堀江・本町・北堀江の4店舗。',
  path: '/reservation',
});

type ReservationSalon = {
  slug: string;
  name: string;
  description: string;
  nearestStation: string;
  hotpepperUrl: string;
};

export default async function ReservationPage() {
  // ---- 店舗データ取得 ----
  let salons: ReservationSalon[] = [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    salons = SALONS.map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      nearestStation: s.nearestStation,
      hotpepperUrl: s.hotpepperUrl,
    }));
  } else {
    const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .select('slug, name, description, nearest_station, hotpepper_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (salonError) {
      salons = SALONS.map((s) => ({
        slug: s.slug,
        name: s.name,
        description: s.description,
        nearestStation: s.nearestStation,
        hotpepperUrl: s.hotpepperUrl,
      }));
    } else {
      salons = (salonData ?? []).map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.description ?? '',
        nearestStation: r.nearest_station ?? '',
        hotpepperUrl: r.hotpepper_url ?? '',
      }));
    }
  }

  // ---- スタッフデータ取得（スタイリストのみ） ----
  let stylists: StaffMember[] = [];

  if (!supabase) {
    stylists = STAFF.filter((s) => s.role.includes('スタイリスト'));
  } else {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url, sort_order, is_active')
      .eq('is_active', true)
      .ilike('role', '%スタイリスト%')
      .order('sort_order', { ascending: true });

    if (staffError) {
      stylists = STAFF.filter((s) => s.role.includes('スタイリスト'));
    } else {
      stylists = (staffData ?? []).map((r) => {
        const salonName =
          SALONS.find((s) => s.slug === r.salon_slug)?.name ?? r.salon_slug ?? '';
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
  }

  return (
    <main className="pt-16 sm:pt-20">
      {/* ページヘッダー */}
      <div className="py-14 sm:py-20 bg-stone-50 border-b border-stone-100">
        <Container>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] uppercase font-light mb-3">
            Reservation
          </p>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-4">
            ご予約
          </h1>
          <p className="text-sm font-light text-stone-500 leading-relaxed max-w-md">
            ご希望の店舗またはスタッフからお選びください。<br />
            スタッフページではスタイルや施術動画をご確認いただけます。
          </p>
        </Container>
      </div>

      {/* 店舗から選ぶ */}
      <section className="py-16 sm:py-24 bg-white">
        <Container>
          <SectionTitle
            label="By Salon"
            title="店舗から選ぶ"
            description="ご希望の店舗を選んで HotPepper Beauty からご予約いただけます。"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {salons.map((salon) => (
              <div
                key={salon.slug}
                className="border border-stone-200 bg-white p-6 flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-base font-light tracking-wider text-stone-800 mb-1">
                    {salon.name}
                  </h2>
                  {salon.nearestStation && (
                    <p className="text-[11px] text-[#C9A96E] tracking-wider mb-3">
                      {salon.nearestStation}
                    </p>
                  )}
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {salon.description}
                  </p>
                </div>
                {salon.hotpepperUrl && (
                  <a
                    href={salon.hotpepperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 block text-center py-3 text-xs tracking-widest bg-[#C9A96E] text-white hover:bg-[#b8964f] transition-colors"
                  >
                    HotPepperで予約する ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* スタッフから選ぶ */}
      <section className="py-16 sm:py-24 bg-stone-50 border-t border-stone-100">
        <Container>
          <SectionTitle
            label="By Stylist"
            title="スタッフから選ぶ"
            description="スタイリストのページでスタイル・施術動画を確認してからご予約いただけます。"
          />
          {stylists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {stylists.map((member) => (
                <StaffCard key={member.slug} member={member} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-8">
              スタイリスト情報を準備中です。
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
