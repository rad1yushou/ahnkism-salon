import Button from './Button';

type ReservationCTAProps = {
  href?: string;
  label?: string;
  sub?: string;
  external?: boolean;
};

export default function ReservationCTA({
  href = '/salon',
  label = 'ご予約はこちら',
  sub = '店舗を選んでご予約いただけます',
  external = false,
}: ReservationCTAProps) {
  return (
    <div className="text-center">
      <Button href={href} external={external}>
        {label}
      </Button>
      {sub && (
        <p className="mt-3 text-xs text-stone-400 tracking-wider">{sub}</p>
      )}
    </div>
  );
}
