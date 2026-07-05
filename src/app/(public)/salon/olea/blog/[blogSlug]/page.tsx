import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import BlogDetail from '@/components/sections/BlogDetail';

export const dynamic = 'force-dynamic';

const SALON_SLUG = 'olea';

type Props = { params: Promise<{ blogSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogSlug } = await params;
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase
      .from('salon_blogs')
      .select('title, excerpt')
      .eq('salon_slug', SALON_SLUG)
      .eq('slug', blogSlug)
      .eq('is_published', true)
      .maybeSingle();
    if (data) {
      return buildMetadata({
        title: data.title,
        description: data.excerpt ?? data.title,
        path: `/salon/${SALON_SLUG}/blog/${blogSlug}`,
      });
    }
  }
  return buildMetadata({ title: 'ブログ｜olea by AHNKISM', description: '', path: `/salon/${SALON_SLUG}/blog/${blogSlug}` });
}

export default async function OleaBlogDetailPage({ params }: Props) {
  const { blogSlug } = await params;
  if (!blogSlug) notFound();
  return <BlogDetail salonSlug={SALON_SLUG} blogSlug={blogSlug} />;
}
