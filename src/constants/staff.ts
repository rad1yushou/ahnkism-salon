export type StaffMember = {
  slug: string;
  name: string;
  nameKana: string;
  role: string;
  salonSlug: string;
  salonName: string;
  bio: string;
  specialties: string[];
  instagramUrl?: string;
  tiktokUrl?: string;
  bookingUrl?: string;
  recommendedMenu?: string;
  imageUrl?: string;
};

export const STAFF: StaffMember[] = [
  {
    slug: 'yamada-aoi',
    name: '山田 葵',
    nameKana: 'やまだ あおい',
    role: 'トップスタイリスト',
    salonSlug: 'labo',
    salonName: 'AHNKISM labo',
    bio: '髪質改善・縮毛矯正を得意とするトップスタイリスト。お客様一人ひとりの髪質に合わせたオーダーメイドの施術を提供します。',
    specialties: ['髪質改善', '縮毛矯正', 'カラー'],
    instagramUrl: 'https://www.instagram.com/',
  },
  {
    slug: 'suzuki-mina',
    name: '鈴木 美菜',
    nameKana: 'すずき みな',
    role: 'スタイリスト',
    salonSlug: 'elu',
    salonName: 'AHNKISM elu',
    bio: '韓国ヘアとトレンドカラーを得意とするスタイリスト。オルチャン風スタイルからナチュラル系まで幅広く対応します。',
    specialties: ['韓国ヘア', 'カラー', 'レイヤーカット'],
    instagramUrl: 'https://www.instagram.com/',
  },
  {
    slug: 'tanaka-riko',
    name: '田中 理子',
    nameKana: 'たなか りこ',
    role: 'スタイリスト',
    salonSlug: 'nit',
    salonName: 'AHNKISM nit',
    bio: 'ダメージレスなカラーと酸熱トリートメントを得意とするスタイリスト。艶髪・サラサラ髪に仕上げます。',
    specialties: ['髪質改善', 'カラー', 'トリートメント'],
    instagramUrl: 'https://www.instagram.com/',
  },
  {
    slug: 'ito-yuki',
    name: '伊藤 ゆき',
    nameKana: 'いとう ゆき',
    role: 'スタイリスト',
    salonSlug: 'olea',
    salonName: 'AHNKISM olea',
    bio: 'レイヤーカット・ウルフカットなどのトレンドスタイルを得意とするスタイリスト。',
    specialties: ['レイヤーカット', '韓国ヘア', 'カット'],
    instagramUrl: 'https://www.instagram.com/',
  },
];

export function getStaffBySlug(slug: string): StaffMember | undefined {
  return STAFF.find((s) => s.slug === slug);
}

export function getStaffBySalon(salonSlug: string): StaffMember[] {
  return STAFF.filter((s) => s.salonSlug === salonSlug);
}
