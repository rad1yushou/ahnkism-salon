import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Image from 'next/image';
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

const ROLE_TARGETS = ['店長', '副店長', 'スタイリスト'];

function matchesRole(role: string): boolean {
  return ROLE_TARGETS.some((t) => role.includes(t));
}

type ReservationSalon = {
  slug: string;
  shortName: string;
  name: string;
  description: string;
  nearestStation: string;
  hotpepperUrl: string;
  imageUrl: string | null;
};

type SalonGroup = {
  salonSlug: string;
  salonName: string;
  members: StaffMember[];
};

function groupStaffBySalon(staff: StaffMember[]): SalonGroup[] {
  const salonOrder = SALONS.map((s) => s.slug);
  const groupMap = new Map<string, StaffMember[]>();

  for (const member of staff) {
    const key = member.salonSlug || '';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(member);
  }

  const groups: SalonGroup[] = [];

  // SALONS の順番でグループを追加
  for (const slug of salonOrder) {
    const members = groupMap.get(slug);
    if (members && members.length > 0) {
      const salonName = SALONS.find((s) => s.slug === slug)?.name ?? slug;
      groups.push({ salonSlug: slug, salonName, members });
    }
  }

  // 所属未設定（空文字 or SALONS に存在しないスラッグ）を最後にまとめる
  const unassigned: StaffMember[] = [];
  for (const [slug, members] of groupMap.entries()) {
    if (!salonOrder.includes(slug)) {
      unassigned.push(...members);
    }
  }
  if (unassigned.length > 0) {
    groups.push({ salonSlug: '', salonName: '所属未設定', members: unassigned });
  }

  return groups;
}

export default async function ReservationPage() {
  // ---- 店舗データ取得 ----
  let salons: ReservationSalon[] = [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    salons = SALONS.map((s) => ({
      slug: s.slug,
      shortName: s.shortName,
      name: s.name,
      description: s.description,
      nearestStation: s.nearestStation,
      hotpepperUrl: s.hotpepperUrl,
      imageUrl: s.imageUrl ?? null,
    }));
  } else {
    const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .select('slug, short_name, name, description, nearest_station, hotpepper_url, image_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (salonError) {
      salons = SALONS.map((s) => ({
        slug: s.slug,
        shortName: s.shortName,
        name: s.name,
        description: s.description,
        nearestStation: s.nearestStation,
        hotpepperUrl: s.hotpepperUrl,
        imageUrl: s.imageUrl ?? null,
      }));
    } else {
      salons = (salonData ?? []).map((r) => ({
        slug: r.slug,
        shortName: r.short_name ?? r.slug,
        name: r.name,
        description: r.description ?? '',
        nearestStation: r.nearest_station ?? '',
        hotpepperUrl: r.hotpepper_url ?? '',
        imageUrl: r.image_url ?? null,
      }));
    }
  }

  // ---- スタッフデータ取得（店長 / 副店長 / スタイリスト） ----
  let targetStaff: StaffMember[] = [];

  if (!supabase) {
    targetStaff = STAFF.filter((s) => matchesRole(s.role));
  } else {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url, sort_order, is_active')
      .eq('is_active', true)
      .or('role.ilike.%スタイリスト%,role.ilike.%店長%,role.ilike.%副店長%')
      .order('sort_order', { ascending: true });

    if (staffError) {
      targetStaff = STAFF.filter((s) => matchesRole(s.role));
    } else {
      targetStaff = (staffData ?? []).map((r) => {
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

  const staffGroups = groupStaffBySalon(targetStaff);

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
                className="border border-stone-200 bg-white flex flex-col"
              >
                {/* 店舗画像 */}
                <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                  {salon.imageUrl ? (
                    <Image
                      src={salon.imageUrl}
                      alt={salon.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm tracking-widest">
                      {salon.shortName.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* テキスト */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <h2 className="text-base font-light tracking-wider text-stone-800 mb-1">
                      {salon.name}
                    </h2>
                    {salon.nearestStation && (
                      <p className="text-[11px] text-[#C9A96E] tracking-wider mb-3">
                        {salon.nearestStation}
                      </p>
                    )}
                    <p className="text-xs text-stone-500 leading-relaxed whitespace-pre-line">
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
          {staffGroups.length > 0 ? (
            <div className="space-y-14">
              {staffGroups.map((group) => (
                <div key={group.salonSlug || 'unassigned'}>
                  <p className="text-xs tracking-[0.25em] text-[#C9A96E] uppercase mb-6">
                    {group.salonName}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                    {group.members.map((member) => (
                      <StaffCard key={member.slug} member={member} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 text-center py-8">
              スタッフ情報を準備中です。
            </p>
          )}
        </Container>
      </section>
    </main>
  );
}
