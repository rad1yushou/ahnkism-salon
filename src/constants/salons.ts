export type Salon = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  address: string;
  addressPostal: string;
  addressLocality: string;
  tel: string;
  hours: string;
  hoursNote: string;
  nearestStation: string;
  latitude: number;
  longitude: number;
  googleMapUrl: string;
  hotpepperUrl: string;
  instagramUrl: string;
  imageUrl?: string | null;
};

export const SALONS: Salon[] = [
  {
    slug: 'labo',
    name: 'AHNKISM labo',
    shortName: 'labo',
    description:
      '心斎橋エリアの旗艦店。髪質改善・縮毛矯正・韓国ヘアを得意とするAHNKISMグループの主力サロン。',
    address: '大阪府大阪市中央区心斎橋筋X-X-X',
    addressPostal: '542-0085',
    addressLocality: '大阪市中央区',
    tel: '06-XXXX-XXXX',
    hours: '火〜日 10:00〜20:00',
    hoursNote: '月曜定休',
    nearestStation: '地下鉄御堂筋線 心斎橋駅 徒歩3分',
    latitude: 34.6726,
    longitude: 135.5008,
    googleMapUrl: 'https://maps.google.com/?q=AHNKISM+labo',
    hotpepperUrl: 'https://beauty.hotpepper.jp/slnH000402871/',
    instagramUrl: 'https://www.instagram.com/ahnkism/',
  },
  {
    slug: 'elu',
    name: 'AHNKISM elu',
    shortName: 'elu',
    description:
      '堀江エリアのサロン。トレンドカラーとまつ毛エクステを組み合わせたトータルビューティーが得意。',
    address: '大阪府大阪市西区南堀江X-X-X',
    addressPostal: '550-0015',
    addressLocality: '大阪市西区',
    tel: '06-XXXX-XXXX',
    hours: '火〜日 10:00〜20:00',
    hoursNote: '月曜定休',
    nearestStation: '地下鉄長堀鶴見緑地線 西大橋駅 徒歩5分',
    latitude: 34.6741,
    longitude: 135.4935,
    googleMapUrl: 'https://maps.google.com/?q=AHNKISM+elu',
    hotpepperUrl: 'https://beauty.hotpepper.jp/slnH000443160/',
    instagramUrl: 'https://www.instagram.com/ahnkism/',
  },
  {
    slug: 'nit',
    name: 'AHNKISM nit',
    shortName: 'nit',
    description:
      '大阪・本町エリアのサロン。ダメージレスなカラーと酸熱トリートメントで艶髪に仕上げます。',
    address: '大阪府大阪市中央区本町X-X-X',
    addressPostal: '541-0053',
    addressLocality: '大阪市中央区',
    tel: '06-XXXX-XXXX',
    hours: '火〜日 10:00〜20:00',
    hoursNote: '月曜定休',
    nearestStation: '地下鉄御堂筋線 本町駅 徒歩3分',
    latitude: 34.6838,
    longitude: 135.5007,
    googleMapUrl: 'https://maps.google.com/?q=AHNKISM+nit',
    hotpepperUrl: 'https://beauty.hotpepper.jp/slnH000646897/',
    instagramUrl: 'https://www.instagram.com/ahnkism/',
  },
  {
    slug: 'olea',
    name: 'AHNKISM olea',
    shortName: 'olea',
    description:
      '大阪・北堀江エリアのサロン。レイヤーカット・ウルフカットなど韓国スタイルが人気のサロン。',
    address: '大阪府大阪市西区北堀江X-X-X',
    addressPostal: '550-0014',
    addressLocality: '大阪市西区',
    tel: '06-XXXX-XXXX',
    hours: '火〜日 10:00〜20:00',
    hoursNote: '月曜定休',
    nearestStation: '地下鉄四つ橋線 西梅田駅 徒歩8分',
    latitude: 34.6789,
    longitude: 135.4942,
    googleMapUrl: 'https://maps.google.com/?q=AHNKISM+olea',
    hotpepperUrl: 'https://beauty.hotpepper.jp/kr/slnH000646043/',
    instagramUrl: 'https://www.instagram.com/ahnkism/',
  },
];

export function getSalonBySlug(slug: string): Salon | undefined {
  return SALONS.find((s) => s.slug === slug);
}
