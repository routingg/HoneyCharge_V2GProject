import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  tone?: 'neutral' | 'danger';
}

export function SecondaryButton({
  children,
  className,
  fullWidth = true,
  tone = 'neutral',
  type = 'button',
  ...rest
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex min-h-[48px] items-center justify-center gap-2 rounded-button border px-5 py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
        tone === 'neutral' && 'border-border bg-card text-text',
        tone === 'danger' && 'border-danger/30 bg-danger/5 text-danger',
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
