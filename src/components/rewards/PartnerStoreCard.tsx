import { Coins, Footprints } from 'lucide-react';
import type { PartnerStore } from '@/types';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { ChargingTimeFitBadge } from './ChargingTimeFitBadge';
import type { RewardRecommendation } from '@/utils/rewardValue';
import { formatEstimatedValue } from '@/utils/rewardValue';
import { formatDistanceMeters } from '@/utils/calculateDistance';
import { formatPoints } from '@/utils/format';

interface PartnerStoreCardProps {
  store: PartnerStore;
  recommendation: RewardRecommendation;
  onClick: () => void;
}

/**
 * 가로 스크롤용 컴팩트 카드.
 * 정보 우선순위: 혜택 → 도보 시간 → 충전 시간 적합도 → 필요 포인트 → 예상 원화 가치
 */
export function PartnerStoreCard({ store, recommendation, onClick }: PartnerStoreCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[212px] shrink-0 flex-col overflow-hidden rounded-card border border-border bg-card text-left shadow-card active:scale-[0.98]"
    >
      <ImageWithFallback
        src={store.image}
        alt={`${store.name} 이미지`}
        className="h-24 w-full object-cover"
        wrapperClassName="h-24 w-full"
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-[11px] text-text-secondary">{store.name}</p>
        <p className="line-clamp-2 min-h-[2.4em] text-[13px] font-bold leading-snug text-text">
          {store.benefitDescription}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-text-secondary">
          <Footprints size={11} aria-hidden="true" />
          도보 {store.walkingMinutes}분 · {formatDistanceMeters(store.distanceMeters)}
        </p>
        <ChargingTimeFitBadge timeFit={recommendation.timeFit} className="mt-0.5 self-start" />
        <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-dark-gold">
          <Coins size={12} aria-hidden="true" />
          {formatPoints(store.requiredPoints)}
        </p>
        <p className="text-[11px] text-text-secondary">{formatEstimatedValue(store.estimatedValueWon)}</p>
      </div>
    </button>
  );
}
