'use client';

import { useRef, useEffect } from 'react';

type Props = {
  src: string;
  className?: string;
};

/**
 * iOS Safari 対応の自動再生ビデオコンポーネント。
 *
 * - src を SSR 時の HTML に含めることで autoplay 属性を確実に適用
 * - IntersectionObserver で画面内に入った瞬間に play() を呼ぶ
 *   （スクロールして視野外から現れた動画も再生される）
 * - canplay イベントでも play() を試みる（ロード完了後のフォールバック）
 *
 * ⚠️  iOS Safari で安定自動再生するための動画ファイル推奨仕様:
 *     - フォーマット : MP4 (H.264)
 *     - 音声トラック : なし（音声トラックが存在すると Low Power Mode 等で
 *                          muted 設定でも再生ブロックされる場合がある）
 *     - 解像度       : 1080p 以下
 *     - ファイルサイズ: できるだけ小さく（ページ内動画が多い場合は特に重要）
 */
export default function VideoAutoPlay({ src, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tryPlay = () => { el.play().catch(() => {}); };

    // 画面内に入ったら再生（スクロール後の動画対応）
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) tryPlay(); },
      { threshold: 0.1 },
    );
    observer.observe(el);

    // メディア読み込み完了後にも試みる
    el.addEventListener('canplay', tryPlay, { once: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('canplay', tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
    />
  );
}
