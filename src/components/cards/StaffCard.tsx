import Link from 'next/link';
import Image from 'next/image';
import type { StaffMember } from '@/constants/staff';

type StaffCardProps = {
  member: StaffMember;
};

export default function StaffCard({ member }: StaffCardProps) {
  return (
    <Link
      href={`/staff/${member.slug}`}
      className="group block text-center"
    >
      <div className="aspect-square bg-stone-100 overflow-hidden mb-4 rounded-full mx-auto w-32 sm:w-40 relative">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7 text-stone-300">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
            <span className="text-[8px] tracking-[0.2em] text-stone-300 uppercase">Coming Soon</span>
          </div>
        )}
      </div>
      <p className="text-xs tracking-widest text-[#C9A96E] mb-1">
        {member.salonName}
      </p>
      <h3 className="text-sm font-light tracking-wider text-stone-800 mb-1">
        {member.name}
      </h3>
      <p className="text-xs text-stone-500">{member.role}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {member.specialties.map((s) => (
          <span
            key={s}
            className="text-[10px] border border-stone-200 text-stone-400 px-2 py-0.5"
          >
            {s}
          </span>
        ))}
      </div>
      <span className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full border border-[#C9A96E]/40 text-[11px] tracking-widest text-[#C9A96E] group-hover:bg-[#C9A96E] group-hover:text-white transition-colors">
        スタイル・施術動画を見る →
      </span>
    </Link>
  );
}
