import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import StaffCard from '@/components/cards/StaffCard';
import Button from '@/components/ui/Button';
import { STAFF, type StaffMember } from '@/constants/staff';
import { SALONS } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function StaffSection() {
  let staff: StaffMember[] = STAFF;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url, sort_order, is_active, is_featured, featured_order')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('featured_order', { ascending: true })
      .limit(4);

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

  return (
    <section className="py-20 sm:py-28 bg-white">
      <Container>
        <SectionTitle
          label="Our Staff"
          title="スタッフ紹介"
          center
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {staff.map((member) => (
            <StaffCard key={member.slug} member={member} />
          ))}
        </div>
        <div className="text-center">
          <Button href="/staff" variant="outline">
            スタッフ一覧を見る
          </Button>
        </div>
      </Container>
    </section>
  );
}
