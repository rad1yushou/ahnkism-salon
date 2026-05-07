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

export const metadata: Metadata = buildMetadata({
  title: SITE.fullName,
  description: SITE.description,
  path: '/',
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reasons />
      <SalonsSection />
      <MenusSection />
      <BeforeAfterSection />
      <StaffSection />
      <ReviewsSection />
      <RecruitSection />
      <CtaBannerSection />
    </>
  );
}
