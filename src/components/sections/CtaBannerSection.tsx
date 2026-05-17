import Container from '@/components/ui/Container';
import ReservationCTA from '@/components/ui/ReservationCTA';

export default function CtaBannerSection() {
  return (
    <section className="py-20 sm:py-24 bg-white border-t border-stone-100">
      <Container>
        <div className="text-center mb-8">
          <p className="mb-3 text-xs tracking-[0.3em] text-[#C9A96E] uppercase font-light">
            Reservation
          </p>
          <h2 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800 mb-4">
            ご予約はこちら
          </h2>
          <p className="text-sm font-light text-stone-500 leading-relaxed max-w-md mx-auto">
            店舗またはスタッフからお好みの方法でご予約いただけます。
            ご不明な点はお気軽にお問い合わせください。
          </p>
        </div>
        <ReservationCTA
          href="/reservation"
          label="ご予約はこちら"
          sub="店舗・スタッフから選べます"
        />
      </Container>
    </section>
  );
}
