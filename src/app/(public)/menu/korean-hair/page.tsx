import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getMenuBySlug } from '@/constants/menus';
import MenuDetail from '@/components/sections/MenuDetail';

const SLUG = 'korean-hair';

export const metadata: Metadata = (() => {
  const menu = getMenuBySlug(SLUG);
  if (!menu) return {};
  return buildMetadata({
    title: `${menu.name}｜大阪・心斎橋の美容室 AHNKISM`,
    description: menu.description,
    path: `/menu/${SLUG}`,
  });
})();

export default function MenuKoreanHairPage() {
  return <MenuDetail slug={SLUG} />;
}
