import { cn } from '@/utils/cn';

interface ProgressBarProps {
  percent: number;
  className?: string;
  trackClassName?: string;
  label?: string;
}

export function ProgressBar({ percent, className, trackClassName, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-[#EEF0F2]', trackClassName)}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-all duration-500', className)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
