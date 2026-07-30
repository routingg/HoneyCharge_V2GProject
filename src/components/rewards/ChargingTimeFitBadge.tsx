import { Clock3, Hourglass, Timer, TimerOff } from 'lucide-react';
import type { TimeFit } from '@/utils/rewardValue';
import { TIME_FIT_LABEL } from '@/utils/rewardValue';
import { cn } from '@/utils/cn';

const ICONS: Record<TimeFit, typeof Clock3> = {
  perfect: Timer,
  comfortable: Clock3,
  short: Hourglass,
  'not-recommended': TimerOff,
};

const TONES: Record<TimeFit, string> = {
  perfect: 'bg-success/10 text-success',
  comfortable: 'bg-info/10 text-info',
  short: 'bg-primary/15 text-dark-gold',
  'not-recommended': 'bg-[#EEF0F2] text-text-secondary',
};

interface ChargingTimeFitBadgeProps {
  timeFit: TimeFit;
  className?: string;
}

/** 충전 시간 대비 매장 이용 적합도 badge */
export function ChargingTimeFitBadge({ timeFit, className }: ChargingTimeFitBadgeProps) {
  const Icon = ICONS[timeFit];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-chip px-2 py-0.5 text-[11px] font-bold',
        TONES[timeFit],
        className
      )}
    >
      <Icon size={11} aria-hidden="true" />
      {TIME_FIT_LABEL[timeFit]}
    </span>
  );
}
