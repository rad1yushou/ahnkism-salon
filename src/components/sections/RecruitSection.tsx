import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';

export default function RecruitSection() {
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
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button href="/recruit/stylist" variant="outline" className="border-stone-600 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E]">
              スタイリスト募集
            </Button>
            <Button href="/recruit/eyelist" variant="outline" className="border-stone-600 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E]">
              アイリスト募集
            </Button>
            <Button href="/recruit/assistant" variant="outline" className="border-stone-600 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E]">
              アシスタント募集
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
