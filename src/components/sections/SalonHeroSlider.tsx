'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export type SalonHeroSlide = {
  media_url: string;
  media_type: string | null;
};

type Props = {
  slides: SalonHeroSlide[];
  salonName: string;
  salonShortName: string;
  titleY: number;
  titlePosition: string;
};

export default function SalonHeroSlider({
  slides,
  salonName,
  salonShortName,
  titleY,
  titlePosition,
}: Props) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % total);
    }, 3500);
    return () => clearInterval(timer);
  }, [total]);

  if (total === 0) return null;

  return (
    <div className="relative w-full h-[70vh] overflow-hidden bg-stone-900">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {slide.media_type === 'video' ? (
            <video
              src={slide.media_url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-contain sm:object-cover"
            />
          ) : (
            <Image
              src={slide.media_url}
              alt={salonName}
              fill
              className="object-contain sm:object-cover"
              priority={i === 0}
              unoptimized
            />
          )}
        </div>
      ))}

      {/* グラデーションオーバーレイ */}
      {titlePosition === 'top' ? (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />
      ) : titlePosition === 'bottom' ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      ) : (
        <div className="absolute inset-0 bg-black/35" />
      )}

      {/* 店舗名テキスト */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-6 w-full z-10"
        style={{ top: `${titleY}%` }}
      >
        <p className="text-[10px] tracking-[0.3em] text-stone-300 uppercase mb-3">
          {salonShortName}
        </p>
        <h1 className="text-3xl sm:text-5xl font-light tracking-widest text-white">
          {salonName}
        </h1>
      </div>

      {/* ドットナビゲーション */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`スライド ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-5 bg-white/80' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
