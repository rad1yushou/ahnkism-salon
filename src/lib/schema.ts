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

// 構造化データの価格を数値文字列に正規化するメニュー（他メニューは従来どおり）
const NUMERIC_PRICE_SLUGS = ['kamishitsukaizen', 'straight'];

// 単一価格（例: "25000" / "¥16500" / "¥16,500"）だけを数値文字列に変換する。
// 料金幅・「〜」・「要相談」などの単一価格でない表記、0円は null を返す。
function toSinglePriceNumber(price: string): string | null {
  const m = price.trim().match(/^[¥￥]?\s*(\d{1,3}(?:,\d{3})+|\d+)$/);
  if (!m) return null;
  const digits = m[1].replace(/,/g, '');
  return Number(digits) > 0 ? digits : null;
}

function buildMenuOffer(menu: Menu) {
  if (!NUMERIC_PRICE_SLUGS.includes(menu.slug)) {
    return { '@type': 'Offer', price: menu.price, priceCurrency: 'JPY' };
  }
  const numeric = toSinglePriceNumber(menu.price);
  // 変換できない価格は不正な固定価格を出さず offers を省略する（undefined）
  if (!numeric) return undefined;
  return { '@type': 'Offer', price: numeric, priceCurrency: 'JPY' };
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
    offers: buildMenuOffer(menu),
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
