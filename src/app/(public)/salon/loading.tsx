export default function SalonLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-6xl px-5 pt-28 pb-16 sm:px-8">
      <p className="mb-6 text-sm text-stone-600">店舗ページを開いています…</p>
      <div aria-hidden="true" className="motion-safe:animate-pulse space-y-6">
        <div className="h-10 w-2/3 rounded bg-stone-100" />
        <div className="aspect-[4/3] w-full rounded bg-stone-100 sm:aspect-video" />
        <div className="h-5 w-3/4 rounded bg-stone-100" />
      </div>
    </div>
  );
}
