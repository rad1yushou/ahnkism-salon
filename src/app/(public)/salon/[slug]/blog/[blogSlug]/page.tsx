import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { connection } from 'next/server';
import { buildMetadata } from '@/lib/metadata';
import { buildBreadcrumbSchema } from '@/lib/schema';
import { getSalonBySlug } from '@/constants/salons';
import { SITE } from '@/constants/site';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Container from '@/components/ui/Container';
import Breadcrumb from '@/components/seo/Breadcrumb';
import JsonLd from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string; blogSlug: string }>;
};

type BlogDetail = {
  id: string;
  salon_slug: string;
  author_name: string | null;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
};

type BlogMedia = {
  id: string;
  media_url: string;
  media_type: string;
  title: string | null;
  description: string | null;
  alt: string | null;
  sort_order: number;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, blogSlug } = await params;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from('salon_blogs')
      .select('title, excerpt, featured_image_url')
      .eq('salon_slug', slug)
      .eq('slug', blogSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (data) {
      return buildMetadata({
        title: `${data.title}`,
        description: data.excerpt ?? '',
        path: `/salon/${slug}/blog/${blogSlug}`,
        ogImage: data.featured_image_url ?? undefined,
      });
    }
  }

  const salon = getSalonBySlug(slug);
  return buildMetadata({
    title: 'ブログ記事｜AHNKISM',
    description: salon ? `${salon.name}のブログ記事です。` : '',
    path: `/salon/${slug}/blog/${blogSlug}`,
  });
}

export default async function SalonBlogDetailPage({ params }: Props) {
  await connection();
  const { slug, blogSlug } = await params;

  const salon = getSalonBySlug(slug);
  if (!salon) notFound();

  let blog: BlogDetail | null = null;
  let media: BlogMedia[] = [];

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from('salon_blogs')
      .select(
        'id, salon_slug, author_name, category, title, slug, excerpt, body, featured_image_url, is_published, published_at',
      )
      .eq('salon_slug', slug)
      .eq('slug', blogSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (data) {
      blog = data as BlogDetail;

      const { data: mediaData } = await supabase
        .from('salon_blog_media')
        .select('id, media_url, media_type, title, description, alt, sort_order')
        .eq('blog_id', blog.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      media = (mediaData ?? []) as BlogMedia[];
    }
  }

  if (!blog) notFound();

  // JSON-LD: Article
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.excerpt ?? '',
    image: blog.featured_image_url ?? SITE.ogImage,
    datePublished: blog.published_at ?? undefined,
    author: blog.author_name
      ? { '@type': 'Person', name: blog.author_name }
      : { '@type': 'Organization', name: salon.name },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/logo.png` },
    },
    url: `${SITE.url}/salon/${slug}/blog/${blogSlug}`,
    mainEntityOfPage: `${SITE.url}/salon/${slug}/blog/${blogSlug}`,
  };

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'ホーム', path: '/' },
    { name: '店舗一覧', path: '/salon' },
    { name: salon.name, path: `/salon/${slug}` },
    { name: 'ブログ', path: `/salon/${slug}/blog` },
    { name: blog.title, path: `/salon/${slug}/blog/${blogSlug}` },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="pt-20">
        <Breadcrumb
          items={[
            { name: '店舗一覧', path: '/salon' },
            { name: salon.name, path: `/salon/${slug}` },
            { name: 'ブログ', path: `/salon/${slug}/blog` },
            { name: blog.title, path: `/salon/${slug}/blog/${blogSlug}` },
          ]}
        />
      </div>

      <article className="py-12 sm:py-16">
        <Container narrow>
          {/* カテゴリ・メタ */}
          <div className="flex items-center gap-4 mb-4">
            {blog.category && (
              <span className="text-[10px] tracking-widest text-[#C9A96E] uppercase">
                {blog.category}
              </span>
            )}
            {blog.published_at && (
              <time
                dateTime={blog.published_at}
                className="text-[10px] text-stone-400 tracking-wider"
              >
                {new Date(blog.published_at).toLocaleDateString('ja-JP')}
              </time>
            )}
            {blog.author_name && (
              <span className="text-[10px] text-stone-400">{blog.author_name}</span>
            )}
          </div>

          {/* タイトル */}
          <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-8 leading-relaxed">
            {blog.title}
          </h1>

          {/* アイキャッチ */}
          {blog.featured_image_url && (
            <div className="aspect-video bg-stone-100 overflow-hidden relative mb-10">
              <Image
                src={blog.featured_image_url}
                alt={blog.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          )}

          {/* 本文 */}
          {blog.body && (
            <div className="prose-sm text-stone-700 leading-relaxed whitespace-pre-line mb-12">
              {blog.body}
            </div>
          )}

          {/* 本文画像 */}
          {media.length > 0 && (
            <div className="mt-10 space-y-8">
              {media.map((m) => (
                <figure key={m.id} className="space-y-2">
                  <div className="aspect-video bg-stone-100 overflow-hidden relative">
                    <Image
                      src={m.media_url}
                      alt={m.alt ?? m.title ?? ''}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {(m.title || m.description) && (
                    <figcaption className="space-y-1">
                      {m.title && (
                        <p className="text-xs font-medium text-stone-700 tracking-wider">
                          {m.title}
                        </p>
                      )}
                      {m.description && (
                        <p className="text-xs text-stone-500 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {/* フッター */}
          <div className="mt-12 pt-8 border-t border-stone-100 flex flex-wrap gap-4">
            <Link
              href={`/salon/${slug}/blog`}
              className="text-xs text-stone-500 hover:text-[#C9A96E] transition-colors tracking-wider"
            >
              ← ブログ一覧へ
            </Link>
            <Link
              href={`/salon/${slug}`}
              className="text-xs text-stone-500 hover:text-[#C9A96E] transition-colors tracking-wider"
            >
              {salon.name} トップへ
            </Link>
          </div>
        </Container>
      </article>
    </>
  );
}
