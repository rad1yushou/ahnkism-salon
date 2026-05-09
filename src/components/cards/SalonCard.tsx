import Link from 'next/link';
import Image from 'next/image';
import type { Salon } from '@/constants/salons';

type SalonCardProps = {
  salon: Salon;
  imageUrl?: string | null;
};

export default function SalonCard({ salon, imageUrl }: SalonCardProps) {
  return (
    <div className="group border border-stone-200 hover:border-[#C9A96E] transition-colors duration-300 bg-white flex flex-col">
      <Link href={`/salon/${salon.slug}`} className="block">
        <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={salon.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm tracking-widest group-hover:scale-105 transition-transform duration-500">
              {salon.shortName.toUpperCase()}
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs tracking-widest text-[#C9A96E] mb-1 uppercase">
            {salon.shortName}
          </p>
          <h3 className="text-base font-light tracking-wider text-stone-800 mb-2">
            {salon.name}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
            {salon.description}
          </p>
          <p className="mt-3 text-xs text-stone-400">{salon.nearestStation}</p>
        </div>
      </Link>
      {salon.hotpepperUrl && (
        <div className="px-5 pb-5 mt-auto">
          <a
            href={salon.hotpepperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-[#C9A96E] hover:bg-[#b8935a] text-white text-sm tracking-widest text-center transition-colors duration-200"
          >
            HotPepperで予約
          </a>
        </div>
      )}
    </div>
  );
}
