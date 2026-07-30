import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { PartnerStoreCard } from './PartnerStoreCard';
import { NearbyRewardCard } from './NearbyRewardCard';
import { partnerStoresForStation } from '@/data/partnerStores';
import { REWARDS } from '@/data/rewards';
import { useAppStore } from '@/store/useAppStore';
import { evaluateReward } from '@/utils/rewardValue';
import { PATHS } from '@/routes/paths';

interface NearbyRewardSectionProps {
  stationId: string | null;
  title: string;
  description?: string;
  limit?: number;
  variant?: 'scroll' | 'list';
  remainingChargingMinutes?: number | null;
  /** 충전 시간 안에 다녀올 수 있는 매장만 우선 노출 */
  preferFitting?: boolean;
  onSeeAll?: () => void;
}

/**
 * 충전소 주변 제휴 매장 혜택 추천 영역.
 * 홈 / 충전소 상세 / 충전 진행 화면에서 공통으로 사용한다.
 */
export function NearbyRewardSection({
  stationId,
  title,
  description,
  limit = 3,
  variant = 'scroll',
  remainingChargingMinutes = null,
  preferFitting = false,
  onSeeAll,
}: NearbyRewardSectionProps) {
  const navigate = useNavigate();
  const pointsBalance = useAppStore((s) => s.pointsBalance);

  const items = useMemo(() => {
    const stores = partnerStoresForStation(stationId);
    const evaluated = stores.map((store) => ({
      store,
      recommendation: evaluateReward({
        store,
        pointsBalance,
        remainingChargingMinutes,
        remainingQuantity: REWARDS.find((r) => r.id === store.rewardId)?.remainingQuantity ?? 1,
      }),
    }));

    const sorted = evaluated.sort((a, b) => b.recommendation.totalScore - a.recommendation.totalScore);
    if (preferFitting) {
      const fitting = sorted.filter((i) => i.recommendation.timeFit !== 'not-recommended');
      if (fitting.length > 0) return fitting.slice(0, limit);
    }
    return sorted.slice(0, limit);
  }, [stationId, pointsBalance, remainingChargingMinutes, preferFitting, limit]);

  if (items.length === 0) {
    return (
      <Card>
        <div className="mb-1 flex items-center gap-1.5">
          <Gift size={16} className="text-dark-gold" aria-hidden="true" />
          <h3 className="text-[15px] font-bold text-text">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary">이 충전소 주변에 등록된 제휴 매장이 아직 없어요.</p>
        <button
          type="button"
          onClick={() => navigate(PATHS.rewards)}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-button border border-border text-sm font-bold text-text"
        >
          전체 리워드 보기
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </Card>
    );
  }

  return (
    <Card padded={false} className="py-4">
      <div className="mb-3 flex items-start justify-between gap-2 px-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-text">
            <Gift size={16} className="shrink-0 text-dark-gold" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </h3>
          {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-info"
          >
            전체 보기
            <ChevronRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {variant === 'scroll' ? (
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {items.map(({ store, recommendation }) => (
            <PartnerStoreCard
              key={store.id}
              store={store}
              recommendation={recommendation}
              onClick={() => navigate(PATHS.rewardDetail(store.rewardId))}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 px-4">
          {items.map(({ store, recommendation }) => (
            <NearbyRewardCard
              key={store.id}
              store={store}
              recommendation={recommendation}
              remainingChargingMinutes={remainingChargingMinutes}
              onClick={() => navigate(PATHS.rewardDetail(store.rewardId))}
            />
          ))}
        </div>
      )}

      <p className="mt-3 px-4 text-[11px] text-text-secondary">
        제휴 매장과 혜택은 서비스 시연을 위한 가상 데이터입니다.
      </p>
    </Card>
  );
}
