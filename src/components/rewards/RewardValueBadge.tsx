import { Sparkles, Wallet } from 'lucide-react';
import { formatValuePerPoint, isHighValue } from '@/utils/rewardValue';
import { cn } from '@/utils/cn';

interface RewardValueBadgeProps {
  valuePerPoint: number;
  affordable: boolean;
  className?: string;
  showAffordability?: boolean;
}

/**
 * 포인트 대비 예상 가치 badge.
 * 표기는 항상 "약 / 상당 / 예상 가치"로, 현금 환급으로 오해되지 않게 한다.
 */
export function RewardValueBadge({
  valuePerPoint,
  affordable,
  className,
  showAffordability = true,
}: RewardValueBadgeProps) {
  const high = isHighValue(valuePerPoint);
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 whitespace-nowrap rounded-chip px-2 py-0.5 text-[11px] font-bold',
          high ? 'bg-primary/15 text-dark-gold' : 'bg-[#EEF0F2] text-text-secondary'
        )}
      >
        <Sparkles size={11} aria-hidden="true" />
        {formatValuePerPoint(valuePerPoint)}
      </span>
      {showAffordability && (
        <span
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap rounded-chip px-2 py-0.5 text-[11px] font-bold',
            affordable ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}
        >
          <Wallet size={11} aria-hidden="true" />
          {affordable ? '보유 포인트로 교환 가능' : '포인트 부족'}
        </span>
      )}
    </span>
  );
}
