import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';

const SALON_SLUG = 'nit';
const SALON_NAME = 'nit by AHNKISM';
const PER_PAGE = 10;

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `ブログ一覧｜${SALON_NAME}`,
    description: `${SALON_NAME}のスタッフが発信するブログ記事一覧です。`,
    path: `/salon/${SALON_SLUG}/blog`,
  });
}

export const dynamic = 'force-dynamic';

export default async function NitBlogListPage({ searchParams }: Props) {
  await connection();
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const { data: blogs, error, count } = await supabase
    .from('salon_blogs')
    .select('id, slug, title, category, author_name, excerpt, featured_image_url, published_at', { count: 'exact' })
    .eq('salon_slug', SALON_SLUG)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error || !blogs) notFound();

  const blogFirstMedia: Record<string, { media_url: string; media_type: string | null; thumbnail_url: string | null }> = {};
  if (blogs.length > 0) {
    const { data: bmData } = await supabase
      .from('salon_blog_media')
      .select('blog_id, media_url, media_type, thumbnail_url')
      .in('blog_id', blogs.map(b => b.id))
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    for (const m of bmData ?? []) {
      const bid = (m as { blog_id: string }).blog_id;
      if (!blogFirstMedia[bid]) {
        blogFirstMedia[bid] = {
          media_url: m.media_url as string,
          media_type: m.media_type as string | null,
          thumbnail_url: (m as { thumbnail_url?: string | null }).thumbnail_url ?? null,
        };
      }
    }
  }

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <>
      <div className="pt-24 pb-4">
        <Container>
          <Breadcrumb items={[
            { name: '店舗一覧', path: '/salon' },
            { name: SALON_NAME, path: `/salon/${SALON_SLUG}` },
            { name: 'ブログ', path: `/salon/${SALON_SLUG}/blog` },
          ]} />
        </Container>
      </div>

      <section className="py-8 sm:py-12">
        <Container>
          <p className="text-[9px] tracking-[0.3em] text-[#C9A96E] uppercase mb-1.5 text-center">Blog</p>
          <h1 className="text-lg font-light tracking-wider text-stone-800 mb-10 text-center">ブログ</h1>

          {blogs.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-16">ブログ記事はまだありません</p>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {blogs.map(blog => {
                const fallback = blogFirstMedia[blog.id];
                return (
                  <Link key={blog.id} href={`/salon/${SALON_SLUG}/blog/${blog.slug}`} className="block group">
                    <article className="flex flex-col sm:flex-row border border-stone-100 hover:border-stone-300 transition-colors overflow-hidden">
                      <div className="w-full sm:w-2/5 shrink-0">
                        {blog.featured_image_url ? (
                          <div className="aspect-[3/2] bg-stone-50 overflow-hidden relative">
                            <Image src={blog.featured_image_url} alt={blog.title} fill className="object-cover" unoptimized />
                          </div>
                        ) : fallback?.media_type === 'video' ? (
                          fallback.thumbnail_url ? (
                            <div className="aspect-[3/2] bg-stone-50 overflow-hidden relative">
                              <Image src={fallback.thumbnail_url} alt={blog.title} fill className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="aspect-[3/2] bg-stone-900 flex items-center justify-center">
                              <span className="text-[10px] text-stone-400 tracking-widest">VIDEO</span>
                            </div>
                          )
                        ) : fallback?.media_url ? (
                          <div className="aspect-[3/2] bg-stone-50 overflow-hidden relative">
                            <Image src={fallback.media_url} alt={blog.title} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="aspect-[3/2] bg-stone-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {blog.category && (
                              <span className="text-[9px] tracking-[0.15em] text-[#C9A96E] uppercase">{blog.category}</span>
                            )}
                            {blog.published_at && (
                              <time className="text-[9px] text-stone-300" dateTime={blog.published_at}>
                                {new Date(blog.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                              </time>
                            )}
                          </div>
                          {blog.author_name && (
                            <p className="text-[10px] text-stone-400 mb-1.5">{blog.author_name}</p>
                          )}
                          <h2 className="text-sm font-light text-stone-800 leading-snug line-clamp-2 mb-2">{blog.title}</h2>
                          {blog.excerpt && (
                            <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">{blog.excerpt}</p>
                          )}
                        </div>
                        <p className="text-[9px] tracking-wider text-stone-400 group-hover:text-stone-600 transition-colors mt-3">続きを読む →</p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-12">
              {page > 1 ? (
                <Link
                  href={`/salon/${SALON_SLUG}/blog?page=${page - 1}`}
                  className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-2 hover:border-stone-500 transition-colors"
                >
                  ← 前へ
                </Link>
              ) : (
                <span className="text-xs tracking-wider text-stone-200 border border-stone-100 px-5 py-2">← 前へ</span>
              )}
              <span className="text-xs text-stone-400">{page} / {totalPages}</span>
              {page < totalPages ? (
                <Link
                  href={`/salon/${SALON_SLUG}/blog?page=${page + 1}`}
                  className="text-xs tracking-wider text-stone-600 border border-stone-300 px-5 py-2 hover:border-stone-500 transition-colors"
                >
                  次へ →
                </Link>
              ) : (
                <span className="text-xs tracking-wider text-stone-200 border border-stone-100 px-5 py-2">次へ →</span>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
