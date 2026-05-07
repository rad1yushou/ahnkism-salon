import Container from '@/components/ui/Container';
import SectionTitle from '@/components/ui/SectionTitle';

const REASONS = [
  {
    number: '01',
    title: '髪質改善の専門技術',
    description:
      '酸熱トリートメント・酸性縮毛矯正など、最新の髪質改善技術を豊富に用意。あなたの髪質に合わせたベストな施術をご提案します。',
  },
  {
    number: '02',
    title: '大阪4店舗のグループ展開',
    description:
      '心斎橋・堀江・本町・北堀江に4店舗展開。お近くのサロンでいつでもご来店いただけます。',
  },
  {
    number: '03',
    title: 'トレンドに強いスタイリスト',
    description:
      '韓国ヘア・レイヤーカット・バレイヤージュなど、最新トレンドを熟知したスタイリストが在籍。',
  },
  {
    number: '04',
    title: 'ヘア＆まつ毛のワンストップ',
    description:
      '美容室とアイリストが同じグループ内に。ヘアとまつ毛エクステを同日で仕上げることができます。',
  },
];

export default function Reasons() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <Container>
        <SectionTitle
          label="Why AHNKISM"
          title="選ばれる理由"
          center
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
          {REASONS.map((r) => (
            <div key={r.number} className="flex gap-5">
              <span className="text-3xl font-light text-stone-200 tracking-wider leading-none shrink-0 w-10">
                {r.number}
              </span>
              <div>
                <h3 className="text-sm tracking-wider text-stone-800 font-light mb-2">
                  {r.title}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {r.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
