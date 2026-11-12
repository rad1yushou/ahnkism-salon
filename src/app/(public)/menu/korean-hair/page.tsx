import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import MenuDetail from '@/components/sections/MenuDetail';

const SLUG = 'korean-hair';

// 親layoutのtitle.templateが「｜AHNKISM」を付与するため、titleにはAHNKISMを含めない
export const metadata: Metadata = buildMetadata({
  title: 'パーフェクト艶カラー｜大阪・心斎橋の美容室',
  description:
    '大阪・心斎橋のAHNKISMが提供するパーフェクト艶カラー。ケラチン・コラーゲンなどのケア成分をカラー剤に配合。ヘマチンやバッファーを使った残留薬剤への処理とキューティクル保護まで行い、艶や手触りにこだわったカラーを提供します。',
  path: `/menu/${SLUG}`,
});

export default function MenuKoreanHairPage() {
  return <MenuDetail slug={SLUG} />;
}
