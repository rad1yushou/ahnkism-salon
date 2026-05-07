import { cn } from '@/lib/utils';

type SectionTitleProps = {
  label?: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
};

export default function SectionTitle({
  label,
  title,
  description,
  center = false,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('mb-12', center && 'text-center', className)}>
      {label && (
        <p className="mb-3 text-xs tracking-[0.3em] text-[#C9A96E] uppercase font-light">
          {label}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl font-light tracking-wider text-stone-800">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-stone-500 font-light">
          {description}
        </p>
      )}
    </div>
  );
}
