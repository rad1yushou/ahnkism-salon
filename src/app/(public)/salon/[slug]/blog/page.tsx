import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { connection } from 'next/server';
import { buildMetadata } from '@/lib/metadata';
import { getSalonBySlug } from '@/constants/salons';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  author_name: string | null;
  published_at: string | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const salon = getSalonBySlug(slug);
  if (!salon) {
    return buildMetadata({ title: 'ブログ｜AHNKISM', description: '' });
  }
  return buildMetadata({
    title: `ブログ｜${salon.name}`,
    description: `${salon.name}のスタイリストによるブログ記事一覧です。`,
    path: `/salon/${slug}/blog`,
  });
}

export default async function SalonBlogListPage({ params }: Props) {
  await connection();
  const { slug } = await params;

  const salon = getSalonBySlug(slug);
  if (!salon) notFound();

  let blogs: BlogListItem[] = [];

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from('salon_blogs')
      .select('id, title, slug, excerpt, featured_image_url, category, author_name, published_at')
      .eq('salon_slug', slug)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });
    blogs = (data ?? []) as BlogListItem[];
  }

  return (
    <>
      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: '店舗一覧', path: '/salon' },
            { name: salon.name, path: `/salon/${slug}` },
            { name: 'ブログ', path: `/salon/${slug}/blog` },
          ]}
        />
      </div>

      <section className="py-12 sm:py-16">
        <Container>
          <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3">Blog</p>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-10">
            {salon.name} ブログ
          </h1>

          {blogs.length === 0 ? (
            <p className="text-sm text-stone-500">記事はまだありません。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/salon/${slug}/blog/${blog.slug}`}
                  className="group block"
                >
                  <div className="aspect-video bg-stone-100 overflow-hidden relative mb-4">
                    {blog.featured_image_url ? (
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs tracking-widest">
                        PHOTO
                      </div>
                    )}
                  </div>
                  {blog.category && (
                    <p className="text-[10px] tracking-widest text-[#C9A96E] mb-1 uppercase">
                      {blog.category}
                    </p>
                  )}
                  <h2 className="text-sm font-light tracking-wider text-stone-800 mb-2 group-hover:text-[#C9A96E] transition-colors line-clamp-2">
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {blog.author_name && (
                      <p className="text-[10px] text-stone-400">{blog.author_name}</p>
                    )}
                    {blog.published_at && (
                      <p className="text-[10px] text-stone-300">
                        {new Date(blog.published_at).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-stone-100">
            <Link
              href={`/salon/${slug}`}
              className="text-xs text-stone-500 hover:text-[#C9A96E] transition-colors tracking-wider"
            >
              ← {salon.name} トップへ戻る
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
