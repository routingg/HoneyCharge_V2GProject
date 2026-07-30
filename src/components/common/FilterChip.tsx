import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap rounded-chip border px-3.5 text-[13px] font-semibold transition',
        active ? 'border-primary bg-primary text-[#202124]' : 'border-border bg-card text-text-secondary'
      )}
    >
      {children}
    </button>
  );
}
