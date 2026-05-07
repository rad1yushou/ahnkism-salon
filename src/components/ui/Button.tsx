import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  external?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#C9A96E] text-white hover:bg-[#b8964f] border border-[#C9A96E]',
  outline:
    'bg-transparent text-[#C9A96E] border border-[#C9A96E] hover:bg-[#C9A96E] hover:text-white',
  ghost:
    'bg-transparent text-stone-700 border border-stone-300 hover:border-stone-500',
};

const base =
  'inline-flex items-center justify-center px-7 py-3 text-sm tracking-widest font-light transition-all duration-300 rounded-none';

export default function Button({
  href,
  variant = 'primary',
  className,
  children,
  onClick,
  type = 'button',
  external = false,
}: ButtonProps) {
  const classes = cn(base, variantClasses[variant], className);

  if (href) {
    return external ? (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
