import type { Metadata } from 'next';
import { SITE } from '@/constants/site';

type MetadataOptions = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
};

export function buildMetadata({
  title,
  description,
  path = '',
  ogImage,
}: MetadataOptions): Metadata {
  const url = `${SITE.url}${path}`;
  const image = ogImage ?? SITE.ogImage;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: SITE.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: SITE.twitter,
    },
  };
}
