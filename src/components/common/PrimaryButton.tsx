import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  className,
  loading = false,
  fullWidth = true,
  disabled,
  type = 'button',
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'flex min-h-[48px] items-center justify-center gap-2 rounded-button bg-primary px-5 py-3 text-[15px] font-semibold text-[#202124] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
