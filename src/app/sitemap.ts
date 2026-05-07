import type { MetadataRoute } from 'next';
import { SITE } from '@/constants/site';
import { SALONS } from '@/constants/salons';
import { MENUS } from '@/constants/menus';
import { STAFF } from '@/constants/staff';

const base = SITE.url;
const now = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticPages, ...salonPages, ...menuPages, ...staffPages];
}
