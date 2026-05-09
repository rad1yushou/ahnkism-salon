'use client';

import { useRef, useEffect, useState } from 'react';

type Props = {
  src: string;
  className?: string;
};

export default function LazyAutoPlayVideo({ src, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setActiveSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!activeSrc || !el) return;
    el.load();
    el.play().catch(() => {});
  }, [activeSrc]);

  return (
    <video
      ref={videoRef}
      src={activeSrc ?? undefined}
      preload="metadata"
      autoPlay
      muted
      loop
      playsInline
      className={className}
    />
  );
}
