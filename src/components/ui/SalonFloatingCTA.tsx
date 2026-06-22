'use client';

type Props = {
  href: string;
  label: string;
};

export default function SalonFloatingCTA({ href, label }: Props) {
  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 px-4"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-4 rounded-xl bg-[#C9A96E] text-white text-sm tracking-widest shadow-lg hover:bg-[#b8964f] transition-colors"
      >
        {label}
      </a>
    </div>
  );
}
