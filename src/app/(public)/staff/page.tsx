import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import StaffCard from '@/components/cards/StaffCard';
import Breadcrumb from '@/components/seo/Breadcrumb';
import { STAFF, type StaffMember } from '@/constants/staff';
import { SALONS } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: 'スタッフ一覧｜AHNKISMグループの美容師・アイリスト',
  description: 'AHNKISMグループの美容師・アイリスト一覧。髪質改善・縮毛矯正・韓国ヘア・まつ毛エクステの専門スタッフが在籍。大阪・心斎橋・堀江。',
  path: '/staff',
});

export default async function StaffListPage() {
  let staff: StaffMember[] = STAFF;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      staff = data.map((r) => {
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
    // error の場合は初期値の STAFF をそのまま使う
  }

  // 店舗ごとにグループ化
  const salonGroups = SALONS.map((salon) => ({
    slug: salon.slug,
    name: salon.name,
    members: staff.filter((m) => m.salonSlug === salon.slug),
  })).filter((g) => g.members.length > 0);

  const unassigned = staff.filter(
    (m) => !m.salonSlug || !SALONS.some((s) => s.slug === m.salonSlug)
  );

  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'スタッフ一覧', path: '/staff' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle
            label="Our Staff"
            title="スタッフ紹介"
            description="AHNKISMグループのスタイリスト・アイリストをご紹介します。"
            center
          />
          <div className="space-y-16">
            {salonGroups.map((group) => (
              <div key={group.slug}>
                <h2 className="text-sm tracking-[0.3em] text-[#C9A96E] uppercase mb-6">
                  {group.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {group.members.map((member) => (
                    <StaffCard key={member.slug} member={member} />
                  ))}
                </div>
              </div>
            ))}
            {unassigned.length > 0 && (
              <div>
                <h2 className="text-sm tracking-[0.3em] text-stone-400 uppercase mb-6">
                  所属未設定
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {unassigned.map((member) => (
                    <StaffCard key={member.slug} member={member} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
