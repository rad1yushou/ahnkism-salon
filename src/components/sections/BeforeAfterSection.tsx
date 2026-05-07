import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';
import BeforeAfterCard from '@/components/cards/BeforeAfterCard';
import Button from '@/components/ui/Button';

const SAMPLES = [
  { menuName: '髪質改善トリートメント', alt: 'くせ毛・広がりが改善された仕上がり' },
  { menuName: '縮毛矯正', alt: 'うねり毛がナチュラルなストレートに' },
  { menuName: '韓国ヘア × カラー', alt: 'レイヤーカット＋透明感カラーの仕上がり' },
];

export default function BeforeAfterSection() {
  return (
    <section className="py-20 sm:py-28 bg-stone-50">
      <Container>
        <SectionTitle
          label="Before / After"
          title="施術実績"
          description="実際の施術のビフォーアフターをご覧ください。"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {SAMPLES.map((s, i) => (
            <BeforeAfterCard key={i} menuName={s.menuName} alt={s.alt} />
          ))}
        </div>
        <div className="text-center">
          <Button href="/style" variant="outline">
            スタイル一覧を見る
          </Button>
        </div>
      </Container>
    </section>
  );
}
