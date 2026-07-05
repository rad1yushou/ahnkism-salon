import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type BlogDetailProps = {
  salonSlug: string;
  blogSlug: string;
};

type BlogMedia = {
  id: string;
  media_url: string;
  title: string | null;
  alt: string | null;
  sort_order: number;
  media_aspect: string;
};

function aspectClass(aspect: string | null): string {
  const map: Record<string, string> = {
    '1:1':  'aspect-square',
    '4:3':  'aspect-[4/3]',
    '3:4':  'aspect-[3/4]',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
  };
  return map[aspect ?? ''] ?? 'aspect-[4/3]';
}

export default async function BlogDetail({ salonSlug, blogSlug }: BlogDetailProps) {
  await connection();

  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const { data: blog, error } = await supabase
    .from('salon_blogs')
    .select('id, title, category, author_name, excerpt, body, featured_image_url, featured_image_aspect, published_at')
    .eq('salon_slug', salonSlug)
    .eq('slug', blogSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !blog) notFound();

  const { data: mediaData } = await supabase
    .from('salon_blog_media')
    .select('id, media_url, title, alt, sort_order, media_aspect')
    .eq('blog_id', blog.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const media = (mediaData ?? []) as BlogMedia[];

  return (
    <div className="pt-20 pb-16">
      <Container narrow>
        {/* パンくず */}
        <nav className="mb-8 text-[10px] tracking-wider text-stone-400 flex items-center gap-2">
          <Link href="/" className="hover:text-stone-600 transition-colors">TOP</Link>
          <span>/</span>
          <Link href="/salon" className="hover:text-stone-600 transition-colors">店舗一覧</Link>
          <span>/</span>
          <Link href={`/salon/${salonSlug}`} className="hover:text-stone-600 transition-colors uppercase">{salonSlug}</Link>
          <span>/</span>
          <span className="text-stone-600">ブログ</span>
        </nav>

        {/* カテゴリ */}
        {blog.category && (
          <p className="text-[10px] tracking-[0.3em] text-[#C9A96E] uppercase mb-3">{blog.category}</p>
        )}

        {/* タイトル */}
        <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 leading-relaxed mb-4">
          {blog.title}
        </h1>

        {/* メタ情報 */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-stone-100">
          {blog.published_at && (
            <time className="text-xs text-stone-400" dateTime={blog.published_at}>
              {new Date(blog.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          )}
          {blog.author_name && (
            <span className="text-xs text-stone-400">{blog.author_name}</span>
          )}
        </div>

        {/* アイキャッチ画像 */}
        {blog.featured_image_url && (
          <div className={`${aspectClass(blog.featured_image_aspect)} overflow-hidden mb-8`}>
            <Image
              src={blog.featured_image_url}
              alt={blog.title}
              width={800}
              height={600}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}

        {/* 本文 */}
        {blog.body && (
          <div className="prose prose-stone prose-sm max-w-none mb-10">
            {blog.body.split('\n').map((line: string, i: number) => (
              line.trim() === ''
                ? <br key={i} />
                : <p key={i} className="text-sm text-stone-700 leading-relaxed mb-3">{line}</p>
            ))}
          </div>
        )}

        {/* 追加メディア */}
        {media.length > 0 && (
          <div className="mt-10 pt-8 border-t border-stone-100">
            <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4">Gallery</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {media.map(m => (
                <div key={m.id} className={`${aspectClass(m.media_aspect)} overflow-hidden`}>
                  <Image
                    src={m.media_url}
                    alt={m.alt ?? m.title ?? ''}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 戻るリンク */}
        <div className="mt-12 pt-8 border-t border-stone-100">
          <Link
            href={`/salon/${salonSlug}`}
            className="text-xs tracking-wider text-stone-500 hover:text-stone-800 transition-colors"
          >
            ← 店舗ページに戻る
          </Link>
        </div>
      </Container>
    </div>
  );
}
