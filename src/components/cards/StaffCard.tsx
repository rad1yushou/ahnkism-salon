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
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs tracking-widest group-hover:scale-105 transition-transform duration-500">
            PHOTO
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
    </Link>
  );
}
