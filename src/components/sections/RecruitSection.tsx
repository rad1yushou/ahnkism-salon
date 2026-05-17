import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// フォールバック用固定データ（Supabase 未設定・接続エラー時のみ使用）
const FALLBACK_JOBS = [
  { href: '/recruit/stylist',   label: 'スタイリスト募集' },
  { href: '/recruit/eyelist',   label: 'アイリスト募集' },
  { href: '/recruit/assistant', label: 'アシスタント募集' },
];

type JobItem = {
  slug: string;
  title: string;
};

export default async function RecruitSection() {
  // null = フォールバック、[] = 取得成功0件
  let jobs: JobItem[] | null = null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    jobs = null;
  } else {
    const { data, error } = await supabase
      .from('recruit_jobs')
      .select('slug, title')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      jobs = null;
    } else {
      jobs = data ?? [];
    }
  }

  const buttons =
    jobs === null
      ? FALLBACK_JOBS.map((j) => ({ href: j.href, label: j.label }))
      : jobs.map((j) => ({ href: `/recruit/${j.slug}`, label: j.title }));

  return (
    <section className="py-20 sm:py-28 bg-stone-900">
      <Container>
        <div className="text-center">
          <p className="mb-3 text-xs tracking-[0.3em] text-[#C9A96E] uppercase font-light">
            Join Us
          </p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-wider text-white mb-4">
            採用情報
          </h2>
          <p className="text-sm font-light text-stone-400 leading-relaxed mb-8 max-w-lg mx-auto">
            AHNKISMグループでは、美容師・アイリストを随時募集しています。
            スタッフの技術と働きやすい環境を大切にしています。
          </p>
          {buttons.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {buttons.map((btn) => (
                <Button
                  key={btn.href}
                  href={btn.href}
                  variant="outline"
                  className="border-stone-600 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E]"
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
