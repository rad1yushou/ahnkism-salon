import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE } from '@/constants/site';
import { SALONS } from '@/constants/salons';
import { MENUS } from '@/constants/menus';
import { STAFF } from '@/constants/staff';

const base = SITE.url;
const now = new Date();

const ALLOWED_SALON_SLUGS = new Set(['labo', 'elu', 'nit', 'olea']);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/salon`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/staff`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/style`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/column`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/access`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/recruit`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/recruit/stylist`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/recruit/assistant`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/recruit/eyelist`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const salonPages: MetadataRoute.Sitemap = SALONS.map((s) => ({
    url: `${base}/salon/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  const menuPages: MetadataRoute.Sitemap = MENUS.map((m) => ({
    url: `${base}/menu/${m.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const staffPages: MetadataRoute.Sitemap = STAFF.map((s) => ({
    url: `${base}/staff/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // ブログ一覧ページ（ルートが実在する店舗のみ）
  const blogListPages: MetadataRoute.Sitemap = Array.from(ALLOWED_SALON_SLUGS).map((slug) => ({
    url: `${base}/salon/${slug}/blog`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 公開ブログ記事（Supabase から動的取得）
  let blogArticlePages: MetadataRoute.Sitemap = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('salon_blogs')
        .select('salon_slug, slug, updated_at')
        .eq('is_published', true);

      if (error) {
        console.error('[sitemap] salon_blogs fetch error:', error.message);
      } else {
        const seen = new Set<string>();
        for (const row of data ?? []) {
          const salonSlug = row.salon_slug as string | null;
          const blogSlug = row.slug as string | null;
          if (!salonSlug || !blogSlug) continue;
          if (!ALLOWED_SALON_SLUGS.has(salonSlug)) continue;
          const url = `${base}/salon/${salonSlug}/blog/${blogSlug}`;
          if (seen.has(url)) continue;
          seen.add(url);
          blogArticlePages.push({
            url,
            lastModified: row.updated_at ? new Date(row.updated_at as string) : now,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    } catch (err) {
      console.error('[sitemap] unexpected error fetching blog articles:', err);
    }
  }

  return [...staticPages, ...salonPages, ...menuPages, ...staffPages, ...blogListPages, ...blogArticlePages];
}
