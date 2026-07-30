import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-card shadow-card',
        padded && 'p-4',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
