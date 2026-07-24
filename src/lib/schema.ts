import { SITE } from '@/constants/site';
import type { Salon } from '@/constants/salons';
import type { Menu } from '@/constants/menus';

export function buildSalonSchema(salon: Salon) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: salon.name,
    description: salon.description,
    url: `${SITE.url}/salon/${salon.slug}`,
    telephone: salon.tel,
    address: {
      '@type': 'PostalAddress',
      postalCode: salon.addressPostal,
      addressRegion: '大阪府',
      addressLocality: salon.addressLocality,
      streetAddress: salon.address,
      addressCountry: 'JP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: salon.latitude,
      longitude: salon.longitude,
    },
    openingHours: ['Tu-Su 10:00-20:00'],
    priceRange: '¥¥',
    image: salon.imageUrl ?? SITE.ogImage,
    sameAs: [salon.instagramUrl, salon.hotpepperUrl, salon.googleMapUrl],
  };
}

export function buildGroupSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.png`,
    sameAs: [SITE.instagram, SITE.legacySiteUrl],
  };
}

export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildMenuPageSchema(menu: Menu) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: menu.name,
    description: menu.longDescription,
    provider: {
      '@type': 'HairSalon',
      name: SITE.name,
      url: SITE.url,
    },
    offers: {
      '@type': 'Offer',
      price: menu.price,
      priceCurrency: 'JPY',
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}
