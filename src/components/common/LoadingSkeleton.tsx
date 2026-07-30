import { cn } from '@/utils/cn';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'text' | 'circle';
  count?: number;
  className?: string;
}

function Block({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[#EAEBEE]', className)} />;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => {
        if (variant === 'circle') return <Block key={i} className={cn('h-16 w-16 rounded-full', className)} />;
        if (variant === 'text') return <Block key={i} className={cn('h-4 w-full', className)} />;
        if (variant === 'list')
          return (
            <div key={i} className="flex items-center gap-3">
              <Block className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Block className="h-3.5 w-2/3" />
                <Block className="h-3 w-1/3" />
              </div>
            </div>
          );
        return <Block key={i} className={cn('h-32 w-full rounded-card', className)} />;
      })}
    </div>
  );
}
