-- 007_seed_menus.sql
-- menus テーブルに初期データを投入する
-- slug の重複時は既存レコードを上書き（ON CONFLICT DO UPDATE）
-- slug はURLに影響するため変更しない
-- image_url / category は確認できないため null とする

INSERT INTO menus (
  slug,
  name,
  short_name,
  description,
  long_description,
  price,
  duration,
  sort_order,
  is_active
)
VALUES
  (
    'kamishitsukaizen',
    '髪質改善トリートメント',
    '髪質改善',
    '大阪・心斎橋のAHNKISMが提供する髪質改善トリートメント。酸熱・酸性ストレートで艶髪・サラサラ髪へ。',
    'ダメージを補修しながら髪の内部から整える次世代トリートメント。繰り返すほど髪質が改善されるため、縮毛矯正に頼らずとも扱いやすい艶髪を実現できます。',
    '¥15,000〜',
    '約2〜3時間',
    1,
    true
  ),
  (
    'straight',
    '縮毛矯正',
    '縮毛矯正',
    '大阪・心斎橋のAHNKISMの縮毛矯正。くせ毛・うねり・広がりをおさえ、自然なストレートヘアに。',
    'くせ毛・うねり・広がりにお悩みの方に。薬剤の選定・アイロン技術にこだわり、硬くなりすぎないナチュラルなストレートヘアに仕上げます。',
    '¥18,000〜',
    '約3〜4時間',
    2,
    true
  ),
  (
    'color',
    'カラー',
    'カラー',
    '大阪・心斎橋のAHNKISMのヘアカラー。ブリーチなしの透明感カラー・イルミナカラー・インナーカラーが人気。',
    'ダメージを最小限に抑えたカラーリング技術で、透明感のある発色を実現。グレーカラー・イルミナカラー・インナーカラー・バレイヤージュなど幅広いスタイルに対応。',
    '¥8,000〜',
    '約1.5〜2.5時間',
    3,
    true
  ),
  (
    'korean-hair',
    '韓国ヘア',
    '韓国ヘア',
    '大阪・心斎橋のAHNKISMの韓国ヘア。レイヤーカット・ウルフカット・オルチャンスタイルが人気。',
    '韓国アイドル・インフルエンサーに人気のスタイルを大阪で。ウルフカット・シースルーバング・ポイントパーマなど、トレンドの韓国ヘアをご提案します。',
    '¥6,000〜',
    '約1〜2時間',
    4,
    true
  ),
  (
    'layer-cut',
    'レイヤーカット',
    'レイヤーカット',
    '大阪・心斎橋のAHNKISMのレイヤーカット。動きと軽さを出したウルフ・シャギー・ローレイヤーが人気。',
    '重さを取りながら動きと軽さを出すレイヤーカット。毛先の動きが出やすくスタイリングしやすい仕上がりに。ウルフカット・ローレイヤー・シャギーカットなど豊富なバリエーション。',
    '¥5,500〜',
    '約1時間',
    5,
    true
  ),
  (
    'eyelash',
    'まつ毛エクステ',
    'まつ毛エクステ',
    '大阪・堀江のAHNKISMのまつ毛エクステ。自まつ毛に優しい施術で自然な仕上がりに。',
    'ヘアサロンと併設した美容のワンストップ体験。自まつ毛の健康を最優先に、自然なセーブルから華やかなボリュームラッシュまで対応。',
    '¥4,400〜',
    '約1〜1.5時間',
    6,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  short_name       = EXCLUDED.short_name,
  description      = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  price            = EXCLUDED.price,
  duration         = EXCLUDED.duration,
  sort_order       = EXCLUDED.sort_order,
  is_active        = EXCLUDED.is_active;
