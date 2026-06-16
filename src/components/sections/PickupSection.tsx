import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Container from '@/components/ui/Container';

type Pickup = {
  image_url: string | null;
  alt: string | null;
  label: string | null;
  link_href: string | null;
  media_type: 'image' | 'video';
};

export default async function PickupSection() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pickups')
    .select('image_url, alt, label, link_href, media_type')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) return null;

  const pickups = data as Pickup[];

  return (
    <section className="py-16 sm:py-20 border-t border-stone-100">
      <Container>
        <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-2 text-center">
          Pick Up
        </p>
        <h2 className="text-xl font-light tracking-wider text-stone-800 mb-10 text-center">
          ピックアップ
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
          {pickups.map((pickup, i) => {
            const alt = pickup.alt ?? pickup.label ?? '';
            const cardContent = (
              <>
                <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                  {pickup.image_url ? (
                    pickup.media_type === 'video' ? (
                      <video
                        src={pickup.image_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={pickup.image_url}
                        alt={alt}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        unoptimized
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-[10px] tracking-widest text-stone-400">IMAGE</span>
                    </div>
                  )}
                </div>
                {pickup.label && (
                  <p className="mt-3 text-[10px] tracking-[0.3em] text-stone-500 font-light text-center">
                    {pickup.label}
                  </p>
                )}
              </>
            );

            return pickup.link_href ? (
              <a key={i} href={pickup.link_href} className="block flex flex-col">
                {cardContent}
              </a>
            ) : (
              <div key={i} className="flex flex-col">
                {cardContent}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
