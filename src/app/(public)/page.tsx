import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import Hero from '@/components/sections/Hero';
import Reasons from '@/components/sections/Reasons';
import SalonsSection from '@/components/sections/SalonsSection';
import MenusSection from '@/components/sections/MenusSection';
import BeforeAfterSection from '@/components/sections/BeforeAfterSection';
import StaffSection from '@/components/sections/StaffSection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import RecruitSection from '@/components/sections/RecruitSection';
import CtaBannerSection from '@/components/sections/CtaBannerSection';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: SITE.fullName,
  description: SITE.description,
  path: '/',
});

const DEFAULT_SECTION_KEYS = ['reasons', 'salons', 'menus', 'beforeAfter', 'staff'];

function renderSection(key: string) {
  switch (key) {
    case 'reasons':     return <Reasons key={key} />;
    case 'salons':      return <SalonsSection key={key} />;
    case 'menus':       return <MenusSection key={key} />;
    case 'beforeAfter': return <BeforeAfterSection key={key} />;
    case 'staff':       return <StaffSection key={key} />;
    default:            return null;
  }
}

export default async function HomePage() {
  let sectionKeys: string[] = [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    // Supabase 未設定時のみフォールバック
    sectionKeys = DEFAULT_SECTION_KEYS;
  } else {
    const { data, error } = await supabase
      .from('home_sections')
      .select('section_key')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      // 接続エラー時のみフォールバック
      sectionKeys = DEFAULT_SECTION_KEYS;
    } else {
      // 成功時は DB の順序をそのまま使う（0件でもフォールバックしない）
      sectionKeys = (data ?? []).map((r) => r.section_key);
    }
  }

  return (
    <>
      <Hero />
      {sectionKeys.map((key) => renderSection(key))}
      <ReviewsSection />
      <RecruitSection />
      <CtaBannerSection />
    </>
  );
}
