-- 006_seed_salons.sql
-- salons テーブルに初期データを投入する
-- slug の重複時は既存レコードを上書き（ON CONFLICT DO UPDATE）
-- address / tel / google_map_url / latitude / longitude / image_url は正確な情報が
-- 確認できないため null とする。管理画面 /admin/salons から随時更新すること。

INSERT INTO salons (
  slug,
  name,
  short_name,
  description,
  address_postal,
  address_locality,
  hours,
  hours_note,
  nearest_station,
  hotpepper_url,
  instagram_url,
  sort_order,
  is_active
)
VALUES
  (
    'labo',
    'AHNKISM labo',
    'labo',
    '心斎橋エリアの旗艦店。髪質改善・縮毛矯正・韓国ヘアを得意とするAHNKISMグループの主力サロン。',
    '542-0085',
    '大阪市中央区',
    '火〜日 10:00〜20:00',
    '月曜定休',
    '地下鉄御堂筋線 心斎橋駅 徒歩3分',
    'https://beauty.hotpepper.jp/slnH000402871/',
    'https://www.instagram.com/ahnkism/',
    1,
    true
  ),
  (
    'elu',
    'AHNKISM elu',
    'elu',
    '堀江エリアのサロン。トレンドカラーとまつ毛エクステを組み合わせたトータルビューティーが得意。',
    '550-0015',
    '大阪市西区',
    '火〜日 10:00〜20:00',
    '月曜定休',
    '地下鉄長堀鶴見緑地線 西大橋駅 徒歩5分',
    'https://beauty.hotpepper.jp/slnH000443160/',
    'https://www.instagram.com/ahnkism/',
    2,
    true
  ),
  (
    'nit',
    'AHNKISM nit',
    'nit',
    '大阪・本町エリアのサロン。ダメージレスなカラーと酸熱トリートメントで艶髪に仕上げます。',
    '541-0053',
    '大阪市中央区',
    '火〜日 10:00〜20:00',
    '月曜定休',
    '地下鉄御堂筋線 本町駅 徒歩3分',
    'https://beauty.hotpepper.jp/slnH000646897/',
    'https://www.instagram.com/ahnkism/',
    3,
    true
  ),
  (
    'olea',
    'AHNKISM olea',
    'olea',
    '大阪・北堀江エリアのサロン。レイヤーカット・ウルフカットなど韓国スタイルが人気のサロン。',
    '550-0014',
    '大阪市西区',
    '火〜日 10:00〜20:00',
    '月曜定休',
    '地下鉄四つ橋線 西梅田駅 徒歩8分',
    'https://beauty.hotpepper.jp/kr/slnH000646043/',
    'https://www.instagram.com/ahnkism/',
    4,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  short_name       = EXCLUDED.short_name,
  description      = EXCLUDED.description,
  address_postal   = EXCLUDED.address_postal,
  address_locality = EXCLUDED.address_locality,
  hours            = EXCLUDED.hours,
  hours_note       = EXCLUDED.hours_note,
  nearest_station  = EXCLUDED.nearest_station,
  hotpepper_url    = EXCLUDED.hotpepper_url,
  instagram_url    = EXCLUDED.instagram_url,
  sort_order       = EXCLUDED.sort_order,
  is_active        = EXCLUDED.is_active;
