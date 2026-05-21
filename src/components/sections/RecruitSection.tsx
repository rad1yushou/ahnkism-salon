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
            AHNKISMグループでは、美容師・アイリストを随時募集しています。<br />
            働く環境・教育システム・募集職種について、詳しくはこちらをご覧ください。
          </p>
          <Button
            href="/recruit"
            variant="outline"
            className="border-stone-600 text-stone-300 hover:border-[#C9A96E] hover:text-[#C9A96E]"
          >
            採用情報を見る
          </Button>
        </div>
      </Container>
    </section>
  );
}
