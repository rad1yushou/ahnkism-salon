import Link from 'next/link';
import Image from 'next/image';
import type { Salon } from '@/constants/salons';

type SalonCardProps = {
  salon: Salon;
  imageUrl?: string | null;
};

export default function SalonCard({ salon, imageUrl }: SalonCardProps) {
  return (
    <Link
      href={`/salon/${salon.slug}`}
      className="group block border border-stone-200 hover:border-[#C9A96E] transition-colors duration-300 bg-white"
    >
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
  );
}
