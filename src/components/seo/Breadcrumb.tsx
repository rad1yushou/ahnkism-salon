import Link from 'next/link';
import JsonLd from './JsonLd';
import { buildBreadcrumbSchema } from '@/lib/schema';

type BreadcrumbItem = {
  name: string;
  path: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const all = [{ name: 'ホーム', path: '/' }, ...items];

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(all)} />
      <nav aria-label="パンくずリスト" className="py-3 px-4">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
          {all.map((item, index) => (
            <li key={item.path} className="flex items-center gap-1">
              {index < all.length - 1 ? (
                <>
                  <Link
                    href={item.path}
                    className="hover:text-stone-700 transition-colors"
                  >
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              ) : (
                <span className="text-stone-700" aria-current="page">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
