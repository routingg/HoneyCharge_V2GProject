import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, TrendingUp, Award, Wallet, Clock3, MapPin } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { RewardCard } from '@/components/rewards/RewardCard';
import { NearbyRewardCard } from '@/components/rewards/NearbyRewardCard';
import { EmptyState } from '@/components/common/EmptyState';
import { REWARDS, REWARD_CATEGORIES } from '@/data/rewards';
import { STATIONS } from '@/data/stations';
import { PARTNER_STORES, partnerStoresForStation } from '@/data/partnerStores';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { applyDistances } from '@/utils/calculateDistance';
import { resolveSelectedStation } from '@/utils/stationFilters';
import { evaluateReward, PARTNER_CATEGORY_LABEL } from '@/utils/rewardValue';
import type { PartnerStoreCategory } from '@/types';
import { cn } from '@/utils/cn';
import { PATHS } from '@/routes/paths';

type Tab = 'nearby' | 'all';

const NEARBY_SORTS = ['가까운 순', '혜택 가치순', '충전 시간 적합순'] as const;
type NearbySort = (typeof NEARBY_SORTS)[number];

const PARTNER_CATEGORY_FILTERS: ('전체' | PartnerStoreCategory)[] = [
  '전체',
  'cafe',
  'restaurant',
  'convenience',
  'shopping',
  'tourism',
  'carwash',
];

/** 제휴 매장이 하나라도 연결된 충전소만 기준 충전소 후보로 노출한다. */
const STATION_IDS_WITH_STORES = Array.from(new Set(PARTNER_STORES.flatMap((s) => s.stationIds)));

export default function RewardsHome() {
  const navigate = useNavigate();
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const userLocation = useAppStore((s) => s.userLocation);
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const setSelectedStation = useAppStore((s) => s.setSelectedStation);
  const chargingSession = useAppStore((s) => s.chargingSession);

  const [tab, setTab] = useState<Tab>('nearby');
  const [category, setCategory] = useState<string>('전체');
  const [nearbyCategory, setNearbyCategory] = useState<'전체' | PartnerStoreCategory>('전체');
  const [nearbySort, setNearbySort] = useState<NearbySort>('충전 시간 적합순');
  const [affordableOnly, setAffordableOnly] = useState(false);

  const stationsWithDistance = useMemo(() => applyDistances(STATIONS, userLocation), [userLocation]);
  const baseStation = useMemo(
    () => resolveSelectedStation(stationsWithDistance, selectedStationId, userLocation),
    [stationsWithDistance, selectedStationId, userLocation]
  );

  const stationOptions = useMemo(
    () =>
      stationsWithDistance
        .filter((s) => STATION_IDS_WITH_STORES.includes(s.id))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [stationsWithDistance]
  );

  const remainingChargingMinutes =
    chargingSession && chargingSession.phase !== 'completed'
      ? Math.max(
          0,
          Math.round((new Date(chargingSession.estimatedCompletionAt).getTime() - Date.now()) / 60000)
        )
      : null;

  const nearbyItems = useMemo(() => {
    const stores = partnerStoresForStation(baseStation?.id ?? null);
    const evaluated = stores
      .filter((store) => nearbyCategory === '전체' || store.category === nearbyCategory)
      .map((store) => ({
        store,
        recommendation: evaluateReward({
          store,
          pointsBalance,
          remainingChargingMinutes,
          remainingQuantity: REWARDS.find((r) => r.id === store.rewardId)?.remainingQuantity ?? 1,
        }),
      }))
      .filter((item) => !affordableOnly || item.recommendation.affordability);

    const timeFitRank = { perfect: 0, comfortable: 1, short: 2, 'not-recommended': 3 } as const;

    return evaluated.sort((a, b) => {
      switch (nearbySort) {
        case '가까운 순':
          return a.store.distanceMeters - b.store.distanceMeters;
        case '혜택 가치순':
          return b.recommendation.valuePerPoint - a.recommendation.valuePerPoint;
        case '충전 시간 적합순':
        default: {
          const diff = timeFitRank[a.recommendation.timeFit] - timeFitRank[b.recommendation.timeFit];
          return diff !== 0 ? diff : b.recommendation.totalScore - a.recommendation.totalScore;
        }
      }
    });
  }, [baseStation?.id, nearbyCategory, nearbySort, affordableOnly, pointsBalance, remainingChargingMinutes]);

  const filteredRewards = useMemo(
    () => (category === '전체' ? REWARDS : REWARDS.filter((r) => r.category === category)),
    [category]
  );

  /** 보유 포인트의 예상 가치(1P ≈ 1.2원 가정, 시연용 추정값) */
  const estimatedPointValue = Math.round((pointsBalance * 1.2) / 100) * 100;

  return (
    <MobileLayout title="충전 중 누리는 주변 혜택">
      <div className="flex flex-col gap-4 pb-2">
        <Card className="bg-gradient-to-br from-light-yellow to-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-dark-gold">
            <Coins size={14} aria-hidden="true" />
            보유 포인트
          </div>
          <p className="mt-1 text-3xl font-extrabold text-text">{formatPoints(pointsBalance)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/70 p-2">
              <TrendingUp size={14} className="mx-auto text-success" aria-hidden="true" />
              <p className="mt-1 text-sm font-bold text-text">12,450P</p>
              <p className="text-[11px] text-text-secondary">이번 달 적립</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2">
              <Award size={14} className="mx-auto text-dark-gold" aria-hidden="true" />
              <p className="mt-1 text-sm font-bold text-text">상위 8%</p>
              <p className="text-[11px] text-text-secondary">기여도</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2">
              <Wallet size={14} className="mx-auto text-info" aria-hidden="true" />
              <p className="mt-1 text-sm font-bold text-text">약 {estimatedPointValue.toLocaleString('ko-KR')}원</p>
              <p className="text-[11px] text-text-secondary">포인트 예상 가치</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/70 p-2.5 text-xs">
            <span className="flex items-center gap-1 text-text-secondary">
              <Clock3 size={13} aria-hidden="true" />
              8월 15일 만료 예정 3,000P
            </span>
            <button type="button" onClick={() => navigate(PATHS.rewardHistory)} className="font-semibold text-info">
              내역 보기
            </button>
          </div>
        </Card>

        {/* 탭 */}
        <div role="tablist" aria-label="리워드 보기 방식" className="flex gap-1 rounded-button bg-[#EEF0F2] p-1">
          <TabButton active={tab === 'nearby'} onClick={() => setTab('nearby')}>
            주변 추천
          </TabButton>
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            전체 리워드
          </TabButton>
        </div>

        {tab === 'nearby' ? (
          <>
            <Card className="flex flex-col gap-3">
              <p className="text-sm font-bold text-text">충전하는 동안 가까운 매장에서 혜택을 사용해 보세요</p>

              <div>
                <label htmlFor="reward-station" className="mb-1.5 block text-[11px] font-semibold text-text-secondary">
                  기준 충전소
                </label>
                <select
                  id="reward-station"
                  value={baseStation?.id ?? ''}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="min-h-[44px] w-full rounded-button border border-border bg-card px-3 text-sm text-text"
                >
                  {stationOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)}m` : `${s.distanceKm.toFixed(1)}km`})
                    </option>
                  ))}
                </select>
                {baseStation && (
                  <button
                    type="button"
                    onClick={() => navigate(PATHS.stationDetail(baseStation.id))}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-info"
                  >
                    <MapPin size={11} aria-hidden="true" />
                    {baseStation.name} 상세 보기
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="reward-sort" className="mb-1.5 block text-[11px] font-semibold text-text-secondary">
                  정렬
                </label>
                <select
                  id="reward-sort"
                  value={nearbySort}
                  onChange={(e) => setNearbySort(e.target.value as NearbySort)}
                  className="min-h-[44px] w-full rounded-button border border-border bg-card px-3 text-sm text-text"
                >
                  {NEARBY_SORTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {PARTNER_CATEGORY_FILTERS.map((c) => (
                  <FilterChip key={c} active={nearbyCategory === c} onClick={() => setNearbyCategory(c)}>
                    {c === '전체' ? '전체' : PARTNER_CATEGORY_LABEL[c]}
                  </FilterChip>
                ))}
                <FilterChip active={affordableOnly} onClick={() => setAffordableOnly((v) => !v)}>
                  교환 가능한 상품만
                </FilterChip>
              </div>

              {remainingChargingMinutes !== null && (
                <p className="rounded-2xl bg-light-yellow p-2.5 text-xs font-semibold text-dark-gold">
                  충전 완료까지 {remainingChargingMinutes}분 남았어요. 시간에 맞는 혜택부터 보여드릴게요.
                </p>
              )}
            </Card>

            {nearbyItems.length === 0 ? (
              <EmptyState
                title="조건에 맞는 주변 혜택이 없어요"
                description="카테고리나 기준 충전소를 바꿔보세요"
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {nearbyItems.map(({ store, recommendation }) => (
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

            <p className="text-[11px] text-text-secondary">
              제휴 매장과 혜택은 서비스 시연을 위한 가상 데이터입니다. 표시된 원화 금액은 예상 가치이며 현금 환급이 아닙니다.
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {REWARD_CATEGORIES.map((c) => (
                <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </FilterChip>
              ))}
            </div>

            {filteredRewards.length === 0 ? (
              <EmptyState title="해당 카테고리 상품이 없어요" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredRewards.map((reward) => (
                  <RewardCard key={reward.id} reward={reward} onClick={() => navigate(PATHS.rewardDetail(reward.id))} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'min-h-[40px] flex-1 rounded-[10px] text-sm font-bold transition',
        active ? 'bg-card text-text shadow-card' : 'text-text-secondary'
      )}
    >
      {children}
    </button>
  );
}
