import { ChevronRight, Clock3, Coins, Footprints } from 'lucide-react';
import type { PartnerStore } from '@/types';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { ChargingTimeFitBadge } from './ChargingTimeFitBadge';
import { RewardValueBadge } from './RewardValueBadge';
import type { RewardRecommendation } from '@/utils/rewardValue';
import { formatEstimatedValue, formatTimeFitMessage, PARTNER_CATEGORY_LABEL } from '@/utils/rewardValue';
import { formatDistanceMeters } from '@/utils/calculateDistance';
import { formatPoints } from '@/utils/format';

interface NearbyRewardCardProps {
  store: PartnerStore;
  recommendation: RewardRecommendation;
  remainingChargingMinutes: number | null;
  onClick: () => void;
}

/** 리워드 홈 "주변 추천" 탭에서 쓰는 가로형 리스트 카드 */
export function NearbyRewardCard({
  store,
  recommendation,
  remainingChargingMinutes,
  onClick,
}: NearbyRewardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-card border border-border bg-card p-3 text-left shadow-card active:scale-[0.99]"
    >
      <ImageWithFallback
        src={store.image}
        alt={`${store.name} 이미지`}
        className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        wrapperClassName="h-24 w-24 shrink-0 rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-[11px] text-text-secondary">
            {PARTNER_CATEGORY_LABEL[store.category]} · {store.name}
          </p>
          <ChevronRight size={15} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-text">
          {store.benefitDescription}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary">
          <span className="inline-flex items-center gap-0.5">
            <Footprints size={11} aria-hidden="true" />
            도보 {store.walkingMinutes}분 · {formatDistanceMeters(store.distanceMeters)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock3 size={11} aria-hidden="true" />
            이용 약 {store.averageStayMinutes}분
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <ChargingTimeFitBadge timeFit={recommendation.timeFit} />
          <RewardValueBadge
            valuePerPoint={recommendation.valuePerPoint}
            affordable={recommendation.affordability}
            showAffordability={false}
          />
        </div>

        <p className="mt-1.5 text-[11px] text-text-secondary">
          {formatTimeFitMessage(recommendation.timeFit, remainingChargingMinutes, recommendation.roundTripMinutes)}
        </p>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[14px] font-extrabold text-dark-gold">
            <Coins size={12} aria-hidden="true" />
            {formatPoints(store.requiredPoints)}
          </span>
          <span className="text-[11px] text-text-secondary">{formatEstimatedValue(store.estimatedValueWon)}</span>
        </div>
      </div>
    </button>
  );
}
