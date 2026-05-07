import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { buildMetadata } from '@/lib/metadata';
import Breadcrumb from '@/components/seo/Breadcrumb';
import Container from '@/components/ui/Container';
import ReservationCTA from '@/components/ui/ReservationCTA';
import { STAFF, getStaffBySlug, type StaffMember } from '@/constants/staff';
import { SALONS } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
};

type StaffMedia = {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  alt: string | null;
  sort_order: number;
};

function staffFromRow(r: {
  slug: string;
  name: string;
  name_kana: string | null;
  role: string | null;
  salon_slug: string | null;
  bio: string | null;
  specialties: string[] | null;
  recommended_menu: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  booking_url: string | null;
  image_url: string | null;
}): StaffMember {
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('name, bio, salon_slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      const salonName = SALONS.find((s) => s.slug === data.salon_slug)?.name ?? '';
      return buildMetadata({
        title: `${data.name}｜${salonName}のスタイリスト`,
        description: data.bio ?? '',
        path: `/staff/${slug}`,
      });
    }
  }

  const constMember = getStaffBySlug(slug);
  if (constMember) {
    return buildMetadata({
      title: `${constMember.name}｜${constMember.salonName}のスタイリスト`,
      description: constMember.bio,
      path: `/staff/${slug}`,
    });
  }

  return buildMetadata({
    title: 'スタッフ詳細｜AHNKISMグループ',
    description: 'AHNKISMグループのスタッフ詳細ページです。',
    path: `/staff/${slug}`,
  });
}

export default async function StaffDetailPage({ params }: Props) {
  const { slug } = await params;

  const constMember = getStaffBySlug(slug);
  let member: StaffMember | null = null;
  let staffMedia: StaffMedia[] = [];

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const [staffRes, mediaRes] = await Promise.all([
      supabase
        .from('staff')
        .select('slug, name, name_kana, role, salon_slug, bio, specialties, recommended_menu, instagram_url, tiktok_url, booking_url, image_url')
        .eq('slug', slug)
        .maybeSingle(),
      supabase
        .from('staff_media')
        .select('id, media_url, media_type, alt, sort_order')
        .eq('staff_slug', slug)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(4),
    ]);

    if (!staffRes.error && staffRes.data) {
      member = staffFromRow(staffRes.data);
    }

    if (!mediaRes.error && mediaRes.data) {
      staffMedia = mediaRes.data as StaffMedia[];
    }
  }

  if (!member && constMember) member = constMember;
  if (!member) notFound();

  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: 'スタッフ一覧', path: '/staff' },
            { name: member.name, path: `/staff/${slug}` },
          ]}
        />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>

          {/* プロフィールヘッダー */}
          <div className="flex flex-col sm:flex-row gap-8 mb-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-stone-100 rounded-full overflow-hidden flex items-center justify-center shrink-0 mx-auto sm:mx-0 relative">
              {member.imageUrl ? (
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-stone-300 text-xs tracking-widest">PHOTO</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-2">{member.salonName}</p>
              <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-1">
                {member.name}
              </h1>
              {member.nameKana && (
                <p className="text-xs text-stone-400 mb-1">{member.nameKana}</p>
              )}
              {member.role && (
                <p className="text-sm text-stone-500 mb-4">{member.role}</p>
              )}
              {member.specialties.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {member.specialties.map((s) => (
                    <span key={s} className="text-xs border border-stone-200 text-stone-400 px-3 py-1">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 自己紹介 */}
          {member.bio && (
            <p className="text-sm text-stone-600 leading-relaxed mb-10">{member.bio}</p>
          )}

          {/* おすすめメニュー */}
          {member.recommendedMenu && (
            <div className="mb-10">
              <p className="text-xs tracking-widest text-stone-400 mb-2">おすすめメニュー</p>
              <p className="text-sm text-stone-700">{member.recommendedMenu}</p>
            </div>
          )}

          {/* SNSリンク */}
          {(member.instagramUrl || member.tiktokUrl) && (
            <div className="flex flex-wrap gap-3 mb-10">
              {member.instagramUrl && (
                <a
                  href={member.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-xs text-stone-600 hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
              )}
              {member.tiktokUrl && (
                <a
                  href={member.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-200 text-xs text-stone-600 hover:border-stone-800 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <svg width="14" height="15" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
                    <path d="M15.5 4.3a5.1 5.1 0 0 1-3.1-1.1A5.1 5.1 0 0 1 10.7 0H7.9v12.3a2.4 2.4 0 0 1-2.4 2.1 2.4 2.4 0 0 1-2.4-2.4 2.4 2.4 0 0 1 2.4-2.4c.2 0 .5 0 .7.1V7.1a6 6 0 0 0-.7 0A5.5 5.5 0 0 0 0 12.6 5.5 5.5 0 0 0 5.5 18a5.5 5.5 0 0 0 5.5-5.5V6.2a8 8 0 0 0 4.5 1.4V4.8a5.1 5.1 0 0 1-.5-.5z" />
                  </svg>
                  TikTok
                </a>
              )}
            </div>
          )}

          {/* 施術ギャラリー */}
          {staffMedia.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-light tracking-wider text-stone-800 mb-6">施術ギャラリー</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {staffMedia.map((media) => (
                  <div
                    key={media.id}
                    className="aspect-[3/4] relative bg-stone-100 overflow-hidden"
                  >
                    {media.media_type === 'video' ? (
                      <video
                        src={media.media_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={media.media_url}
                        alt={media.alt ?? member.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 予約CTA */}
          <ReservationCTA
            href={member.bookingUrl || undefined}
            label={`${member.name}を指名して予約する`}
            sub="HotPepper Beauty からご予約いただけます"
            external={!!member.bookingUrl}
          />

        </Container>
      </section>
    </>
  );
}
