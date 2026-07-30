import { Flame } from 'lucide-react';
import type { Reward } from '@/types';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { formatPoints } from '@/utils/format';

interface RewardCardProps {
  reward: Reward;
  onClick?: () => void;
}

export function RewardCard({ reward, onClick }: RewardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-card text-left shadow-card active:scale-[0.98]"
    >
      <div className="relative">
        <ImageWithFallback
          src={reward.image}
          alt={reward.name}
          className="h-28 w-full object-cover"
          wrapperClassName="h-28 w-full"
        />
        {reward.isPopular && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-chip bg-primary px-2 py-0.5 text-[11px] font-bold text-[#202124]">
            <Flame size={11} aria-hidden="true" />
            인기
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="truncate text-[11px] text-text-secondary">{reward.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-bold text-text">{reward.name}</h3>
        <p className="mt-1 text-[15px] font-extrabold text-dark-gold">{formatPoints(reward.requiredPoints)}</p>
        <p className="text-[11px] text-text-secondary">잔여 {reward.remainingQuantity}개</p>
      </div>
    </button>
  );
}
