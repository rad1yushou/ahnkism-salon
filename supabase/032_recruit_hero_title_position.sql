-- 032_recruit_hero_title_position.sql
-- recruit_hero に HERO 文字位置調整カラムを追加
-- 実行場所: Supabase ダッシュボード > SQL Editor

ALTER TABLE recruit_hero
  ADD COLUMN IF NOT EXISTS hero_title_position text NOT NULL DEFAULT 'center'
  CHECK (hero_title_position IN ('top', 'center', 'bottom'));

ALTER TABLE recruit_hero
  ADD COLUMN IF NOT EXISTS hero_title_y_percent int NOT NULL DEFAULT 50
  CHECK (hero_title_y_percent BETWEEN 10 AND 90);

COMMENT ON COLUMN recruit_hero.hero_title_position  IS 'グラデーション方向: top / center / bottom';
COMMENT ON COLUMN recruit_hero.hero_title_y_percent IS 'テキスト縦位置 10=最上部〜50=中央〜90=最下部';
