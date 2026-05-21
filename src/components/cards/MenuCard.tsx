import Link from 'next/link';
import Image from 'next/image';
import type { Menu } from '@/constants/menus';
import LazyAutoPlayVideo from '@/components/ui/LazyAutoPlayVideo';

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

type MenuCardProps = {
  menu: Menu;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  mediaAspect?: string | null;
  mediaPosition?: string | null;
};

export default function MenuCard({ menu, imageUrl, mediaUrl, mediaType, mediaAspect, mediaPosition }: MenuCardProps) {
  const displayUrl = mediaUrl ?? imageUrl ?? null;
  const aspectClass = getAspectClass(mediaUrl ? mediaAspect ?? null : null);
  const positionClass = getPositionClass(mediaUrl ? mediaPosition ?? null : null);

  return (
    <Link
      href={`/menu/${menu.slug}`}
      className="group flex border border-stone-200 hover:border-[#C9A96E] transition-colors duration-300 bg-white"
    >
      {/* テキスト */}
      <div className="flex-1 min-w-0 p-5 flex flex-col">
        <p className="text-xs tracking-widest text-[#C9A96E] mb-2 uppercase">
          Menu
        </p>
        <h3 className="text-base font-light tracking-wider text-stone-800 mb-3">
          {menu.name}
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 flex-1">
          {menu.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-light text-stone-700">{menu.price}</span>
          <span className="text-xs text-stone-400 group-hover:text-[#C9A96E] transition-colors">
            詳細 →
          </span>
        </div>
      </div>

      {/* メディア */}
      {displayUrl && (
        <div className="w-[42%] shrink-0 bg-stone-100 overflow-hidden relative self-stretch">
          <div className="absolute inset-0">
            {mediaType === 'video' && mediaUrl ? (
              <LazyAutoPlayVideo
                src={displayUrl}
                className={`w-full h-full object-cover ${positionClass}`}
              />
            ) : (
              <Image
                src={displayUrl}
                alt={menu.name}
                fill
                className={`object-cover ${positionClass}`}
                unoptimized
              />
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
