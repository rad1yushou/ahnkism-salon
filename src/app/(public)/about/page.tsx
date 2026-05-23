import type { Metadata } from 'next';
import Image from 'next/image';
import { buildMetadata } from '@/lib/metadata';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import ReservationCTA from '@/components/ui/ReservationCTA';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = buildMetadata({
  title: 'グループ紹介｜AHNKISMとは',
  description: 'AHNKISMグループについて。大阪・心斎橋・堀江エリアに4店舗展開する髪質改善専門美容室グループ。コンセプト・こだわり・グループの想いをご紹介します。',
  path: '/about',
});

const FALLBACK_BODY = `AHNKISMは、大阪・心斎橋・堀江エリアを中心に展開する髪質改善専門の美容室グループです。「髪が変わると、自分が変わる。」そのコンセプトのもと、お客様一人ひとりの髪質と向き合い、本当に似合うスタイルをご提案します。
酸熱トリートメント・酸性縮毛矯正などの髪質改善技術はもちろん、韓国ヘア・バレイヤージュカラーなど最新トレンドにも対応。ヘアだけでなく、まつ毛エクステのトータルビューティーも得意とするグループです。
スタッフ全員が技術だけでなく、接客・カウンセリングにもこだわり、初めてのお客様でも安心してご来店いただけるサロンづくりを目指しています。`;

function getAspectClass(aspect: string | null): string {
  if (aspect === 'portrait') return 'aspect-[4/5]';
  if (aspect === 'square') return 'aspect-square';
  if (aspect === 'vertical') return 'aspect-[9/16]';
  return 'aspect-video';
}

function getPositionClass(position: string | null): string {
  if (position === 'top') return 'object-top';
  if (position === 'bottom') return 'object-bottom';
  if (position === 'left') return 'object-left';
  if (position === 'right') return 'object-right';
  return 'object-center';
}

export default async function AboutPage() {
  let body = FALLBACK_BODY;
  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  let mediaAspect: string | null = null;
  let mediaPosition: string | null = null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('about_page')
      .select('body, media_url, media_type, media_aspect, media_position, is_active')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      body = data.body || FALLBACK_BODY;
      mediaUrl = data.media_url ?? null;
      mediaType = data.media_type ?? null;
      mediaAspect = data.media_aspect ?? null;
      mediaPosition = data.media_position ?? null;
    }
  }

  const aspectClass = getAspectClass(mediaAspect);
  const positionClass = getPositionClass(mediaPosition);

  return (
    <>
      <div className="pt-20">
        <Breadcrumb items={[{ name: 'グループ紹介', path: '/about' }]} />
      </div>
      <section className="py-16 sm:py-24">
        <Container narrow>
          <p className="text-xs tracking-[0.3em] text-[#C9A96E] mb-3 uppercase">About</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wider text-stone-800 mb-6">
            AHNKISMとは
          </h1>

          <div className="space-y-8 text-sm text-stone-600 leading-relaxed mb-12">
            {body.split('\n').filter(p => p.trim()).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {mediaUrl ? (
            <div
              className={`${aspectClass} bg-stone-100 overflow-hidden relative mb-12`}
              aria-label="AHNKISMグループのサロン内装"
            >
              {mediaType === 'video' ? (
                <LazyAutoPlayVideo
                  src={mediaUrl}
                  className={`w-full h-full object-cover ${positionClass}`}
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt="AHNKISMグループのサロン内装"
                  fill
                  className={`object-cover ${positionClass}`}
                  unoptimized
                />
              )}
            </div>
          ) : (
            <div
              className="aspect-video bg-stone-100 flex items-center justify-center text-stone-300 text-xs tracking-widest mb-12"
              aria-label="AHNKISMグループのサロン内装"
            >
              PHOTO
            </div>
          )}

          <ReservationCTA />
        </Container>
      </section>
    </>
  );
}
