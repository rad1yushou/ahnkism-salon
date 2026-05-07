import Link from 'next/link';
import type { Menu } from '@/constants/menus';

type MenuCardProps = {
  menu: Menu;
};

export default function MenuCard({ menu }: MenuCardProps) {
  return (
    <Link
      href={`/menu/${menu.slug}`}
      className="group block border border-stone-200 hover:border-[#C9A96E] transition-colors duration-300 bg-white p-6"
    >
      <p className="text-xs tracking-widest text-[#C9A96E] mb-2 uppercase">
        Menu
      </p>
      <h3 className="text-base font-light tracking-wider text-stone-800 mb-3">
        {menu.name}
      </h3>
      <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">
        {menu.description}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-light text-stone-700">{menu.price}</span>
        <span className="text-xs text-stone-400 group-hover:text-[#C9A96E] transition-colors">
          詳細 →
        </span>
      </div>
    </Link>
  );
}
