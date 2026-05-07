import { cn } from '@/lib/utils';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
};

export default function Container({ children, className, narrow = false }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        narrow ? 'max-w-3xl' : 'max-w-5xl',
        className
      )}
    >
      {children}
    </div>
  );
}
