type BeforeAfterCardProps = {
  menuName: string;
  alt: string;
};

export default function BeforeAfterCard({ menuName, alt }: BeforeAfterCardProps) {
  return (
    <div className="overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-stone-200">
        <div className="aspect-[3/4] bg-stone-100 flex items-center justify-center">
          <span className="text-xs text-stone-300 tracking-widest">BEFORE</span>
        </div>
        <div className="aspect-[3/4] bg-stone-50 flex items-center justify-center">
          <span className="text-xs text-stone-300 tracking-widest">AFTER</span>
        </div>
      </div>
      <div className="pt-3">
        <p className="text-xs text-stone-400 tracking-widest">{menuName}</p>
        <p className="text-[10px] text-stone-300 mt-0.5">{alt}</p>
      </div>
    </div>
  );
}
