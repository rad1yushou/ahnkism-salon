'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export type HeroSlide = {
  image_url: string;
  alt: string;
  label: string | null;
  media_type: 'image' | 'video';
};

export type HeroPickup = {
  image_url: string | null;
  alt: string | null;
  label: string | null;
  link_href: string | null;
  sort_order: number;
  media_type: 'image' | 'video';
};

type Props = {
  slides: HeroSlide[];
  pickups: HeroPickup[];
};

// データがない場合のプレースホルダー定義
const PLACEHOLDER_SLIDES = [
  { label: 'SALON IMAGE' },
  { label: 'HAIR QUALITY' },
  { label: 'STRAIGHT' },
  { label: 'COLOR' },
];

const PICKUP_LABELS = ['髪質改善', '艶髪カラー', '縮毛矯正', '韓国ヘア'];

// 本サイト用メディア表示（画像 or 動画）
function SlideMedia({ slide, priority }: { slide: HeroSlide; priority: boolean }) {
  if (slide.media_type === 'video') {
    return (
      <>
        <video
          src={slide.image_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-60"
        />
        <video
          src={slide.image_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-contain z-10"
        />
      </>
    );
  }
  return (
    <Image
      src={slide.image_url}
      alt={slide.alt}
      fill
      className="object-cover"
      priority={priority}
    />
  );
}

function PickupMedia({ pickup, alt }: { pickup: HeroPickup; alt: string }) {
  if (!pickup.image_url) return null;
  if (pickup.media_type === 'video') {
    return (
      <>
        <video
          src={pickup.image_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-60"
        />
        <video
          src={pickup.image_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-contain z-10"
        />
      </>
    );
  }
  return (
    <Image
      src={pickup.image_url}
      alt={alt}
      fill
      className="object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}

export default function HeroClient({ slides, pickups }: Props) {
  const hasSlides = slides.length > 0;
  const totalSlides = hasSlides ? slides.length : PLACEHOLDER_SLIDES.length;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % totalSlides);
    }, 3500);
    return () => clearInterval(timer);
  }, [totalSlides]);

  return (
    <section className="relative bg-white min-h-screen flex flex-col">

      {/* ── スライダー ── */}
      <div className="w-full pt-14 sm:pt-16">
        <div className="relative w-full h-[30vh] sm:h-[35vh] overflow-hidden bg-stone-100">

            {hasSlides ? (
              // Supabase から取得した実画像・動画
              slides.map((slide, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    i === current ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <SlideMedia slide={slide} priority={i === 0} />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/15 pointer-events-none" />
                </div>
              ))
            ) : (
              // データなし時のプレースホルダー
              PLACEHOLDER_SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
                    i === current ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ background: `hsl(${20 + i * 15}, 10%, ${88 - i * 3}%)` }}
                >
                  <span className="text-xs tracking-[0.3em] text-stone-400 font-light uppercase">
                    {slide.label}
                  </span>
                </div>
              ))
            )}

            {/* ドットナビゲーション */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`スライド ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-5 bg-stone-400' : 'w-1.5 bg-stone-300'
                  }`}
                />
              ))}
            </div>
        </div>
      </div>

      {/* ── 中央コンテンツ ── */}
      <div className="flex-1 flex flex-col items-center text-center px-5 sm:px-8 py-7 sm:py-10">

        {/* キャッチコピー */}
        <p className="mb-3 text-xs tracking-[0.4em] text-[#C9A96E] font-light uppercase">
          Hair Salon Group — Osaka
        </p>

        {/* ロゴ */}
        <h1 className="flex justify-center mb-4">
          <Image
            src="/images/ahnkism-logo-transparent-black.png"
            alt="AHNKISM ロゴ"
            width={900}
            height={270}
            className="w-[70vw] sm:w-[55vw] lg:w-[48vw] max-w-[780px] h-auto object-contain"
            priority
          />
        </h1>

        {/* 説明文 */}
        <p className="text-sm font-light tracking-widest text-stone-600 mb-1">
          大阪・心斎橋・堀江の
        </p>
        <p className="text-sm font-light tracking-widest text-stone-600 mb-7">
          髪質改善美容室グループ
        </p>

        {/* ── ピックアップ 4枚 ── */}
        <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-8 px-2 sm:px-0">
          {PICKUP_LABELS.map((label, i) => {
            const pickup = pickups[i];
            const alt = pickup?.alt ?? label;
            const href = pickup?.link_href ?? null;

            const card = (
              <div className="flex flex-col" key={label}>
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 rounded-sm">
                  {pickup?.image_url ? (
                    <PickupMedia pickup={pickup} alt={alt} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[10px] tracking-widest text-stone-400 font-light">
                        IMAGE
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[10px] tracking-[0.3em] text-stone-500 font-light text-center">
                  {pickup?.label ?? label}
                </p>
              </div>
            );

            return href ? (
              <a key={label} href={href} className="block">
                {card}
              </a>
            ) : (
              card
            );
          })}
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/salon" variant="primary">
            店舗を選んでご予約
          </Button>
          <Button href="/menu" variant="outline">
            メニューを見る
          </Button>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-widest text-stone-400 uppercase">Scroll</span>
        <div className="w-px h-10 bg-stone-300 animate-pulse" />
      </div>

    </section>
  );
}
