import Image from 'next/image';

export type LpItemMedia = {
  id: string;
  media_type: 'image' | 'video';
  media_role: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
};

export type LpSectionItem = {
  id: string;
  section_key: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  media: LpItemMedia[];
};

type Props = {
  sectionType: string;
  layoutType: string;
  items: LpSectionItem[];
  label: string;
};

function MediaEl({ m, alt }: { m: LpItemMedia; alt: string }) {
  if (m.media_type === 'video') {
    return (
      <video
        src={m.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }
  return (
    <Image
      src={m.url}
      alt={alt}
      fill
      className="object-cover"
      unoptimized
    />
  );
}

export default function SalonLpSectionItems({ sectionType, layoutType, items, label }: Props) {
  const isBeforeAfter = sectionType === 'before_after';

  if (layoutType === 'pickup') {
    const allMedia = items.flatMap(item => item.media);
    if (allMedia.length === 0) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allMedia.map((m, i) => (
          <div key={m.id} className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
            <MediaEl m={m} alt={m.alt_text ?? `${label} ${i + 1}`} />
          </div>
        ))}
      </div>
    );
  }

  // 項目詳細型
  return (
    <div className="space-y-12">
      {items.map((item) => {
        const beforeMedia = isBeforeAfter ? item.media.filter(m => m.media_role === 'before') : [];
        const afterMedia  = isBeforeAfter ? item.media.filter(m => m.media_role === 'after')  : [];
        const galleryMedia = isBeforeAfter
          ? item.media.filter(m => m.media_role !== 'before' && m.media_role !== 'after')
          : item.media;

        return (
          <div key={item.id}>
            {item.title && (
              <h3 className="text-base sm:text-lg font-light tracking-wider text-stone-800 mb-3">
                {item.title}
              </h3>
            )}
            {item.description && (
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line mb-5">
                {item.description}
              </p>
            )}

            {/* ビフォーアフター: Before / After 2カラム */}
            {isBeforeAfter && (beforeMedia.length > 0 || afterMedia.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-5">
                {beforeMedia[0] && (
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 mb-1">Before</p>
                    <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                      <MediaEl m={beforeMedia[0]} alt={beforeMedia[0].alt_text ?? 'Before'} />
                    </div>
                  </div>
                )}
                {afterMedia[0] && (
                  <div>
                    <p className="text-[10px] tracking-widest text-stone-400 mb-1">After</p>
                    <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                      <MediaEl m={afterMedia[0]} alt={afterMedia[0].alt_text ?? 'After'} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ギャラリー */}
            {galleryMedia.length > 0 && (
              <div className={`grid gap-3 ${
                galleryMedia.length === 1
                  ? 'grid-cols-1'
                  : galleryMedia.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {galleryMedia.map((m, i) => (
                  <div key={m.id} className="relative aspect-video bg-stone-100 overflow-hidden">
                    <MediaEl m={m} alt={m.alt_text ?? `${item.title ?? label} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
