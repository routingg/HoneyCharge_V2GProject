import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  AlertCircle,
  ListChecks,
  Navigation,
  Footprints,
  Clock3,
  MapPin,
  Coins,
} from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { ChargingTimeFitBadge } from '@/components/rewards/ChargingTimeFitBadge';
import { RewardValueBadge } from '@/components/rewards/RewardValueBadge';
import { REWARDS } from '@/data/rewards';
import { STATIONS } from '@/data/stations';
import { partnerStoreForReward } from '@/data/partnerStores';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { formatDistanceMeters } from '@/utils/calculateDistance';
import { evaluateReward, formatEstimatedValue, formatTimeFitMessage } from '@/utils/rewardValue';
import { PATHS } from '@/routes/paths';

export default function RewardDetail() {
  const { rewardId } = useParams<{ rewardId: string }>();
  const navigate = useNavigate();
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const selectedStationId = useAppStore((s) => s.selectedStationId);
  const chargingSession = useAppStore((s) => s.chargingSession);
  const reward = REWARDS.find((r) => r.id === rewardId);
  const store = partnerStoreForReward(rewardId);

  if (!reward) {
    return (
      <MobileLayout title="리워드 상세" showBack showBottomNav={false}>
        <EmptyState title="상품 정보를 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const canExchange = pointsBalance >= reward.requiredPoints;

  const remainingChargingMinutes =
    chargingSession && chargingSession.phase !== 'completed'
      ? Math.max(
          0,
          Math.round((new Date(chargingSession.estimatedCompletionAt).getTime() - Date.now()) / 60000)
        )
      : null;

  // 어느 충전소 기준으로 추천된 혜택인지 (선택 충전소가 이 매장과 연결돼 있으면 그 충전소)
  const referenceStationId =
    store && selectedStationId && store.stationIds.includes(selectedStationId)
      ? selectedStationId
      : (store?.stationIds[0] ?? null);
  const referenceStation = STATIONS.find((s) => s.id === referenceStationId) ?? null;

  const recommendation = store
    ? evaluateReward({
        store,
        pointsBalance,
        remainingChargingMinutes,
        remainingQuantity: reward.remainingQuantity,
      })
    : null;

  const canReturnBeforeDone =
    recommendation && remainingChargingMinutes !== null
      ? remainingChargingMinutes >= recommendation.roundTripMinutes
      : null;

  return (
    <MobileLayout title={reward.name} showBack showBottomNav={false} noPadding>
      <div className="flex flex-col pb-4">
        <ImageWithFallback src={reward.image} alt={reward.name} className="h-56 w-full object-cover" wrapperClassName="h-56 w-full" />
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div>
            <p className="text-sm text-text-secondary">{reward.brand}</p>
            <h1 className="mt-0.5 text-lg font-extrabold text-text">{reward.name}</h1>
            <p className="mt-2 text-2xl font-extrabold text-dark-gold">{formatPoints(reward.requiredPoints)}</p>
            {store && recommendation && (
              <p className="mt-0.5 text-sm text-text-secondary">
                {formatEstimatedValue(store.estimatedValueWon)}
              </p>
            )}
            <p className="mt-1 text-xs text-text-secondary">잔여 {reward.remainingQuantity}개 · 유효기간 {reward.validityDays}일</p>
            {recommendation && (
              <div className="mt-2 flex flex-wrap gap-1">
                <RewardValueBadge
                  valuePerPoint={recommendation.valuePerPoint}
                  affordable={recommendation.affordability}
                />
              </div>
            )}
          </div>

          {store && recommendation && (
            <Card className="bg-light-yellow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-dark-gold">충전 중 이용 안내</h3>
                  {referenceStation && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin size={11} aria-hidden="true" />
                      {referenceStation.name} 기준 추천
                    </p>
                  )}
                </div>
                <ChargingTimeFitBadge timeFit={recommendation.timeFit} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="flex items-center gap-1 text-text-secondary">
                  <Footprints size={12} aria-hidden="true" />
                  충전소에서 도보
                </dt>
                <dd className="text-right font-semibold text-text">
                  {store.walkingMinutes}분 · {formatDistanceMeters(store.distanceMeters)}
                </dd>

                <dt className="flex items-center gap-1 text-text-secondary">
                  <Clock3 size={12} aria-hidden="true" />
                  예상 이용 시간
                </dt>
                <dd className="text-right font-semibold text-text">약 {store.averageStayMinutes}분</dd>

                <dt className="text-text-secondary">충전 완료까지</dt>
                <dd className="text-right font-semibold text-text">
                  {remainingChargingMinutes === null ? '충전 대기 중' : `${remainingChargingMinutes}분 남음`}
                </dd>

                <dt className="text-text-secondary">돌아올 수 있는지</dt>
                <dd
                  className={`text-right font-semibold ${
                    canReturnBeforeDone === null
                      ? 'text-text'
                      : canReturnBeforeDone
                        ? 'text-success'
                        : 'text-danger'
                  }`}
                >
                  {canReturnBeforeDone === null
                    ? `왕복 약 ${recommendation.roundTripMinutes}분 필요`
                    : canReturnBeforeDone
                      ? '충전 완료 전 복귀 가능'
                      : '충전 완료 후 복귀 예상'}
                </dd>

                <dt className="flex items-center gap-1 text-text-secondary">
                  <Coins size={12} aria-hidden="true" />
                  교환 후 남는 포인트
                </dt>
                <dd
                  className={`text-right font-semibold ${
                    recommendation.pointsAfterExchange < 0 ? 'text-danger' : 'text-text'
                  }`}
                >
                  {recommendation.pointsAfterExchange < 0
                    ? `${formatPoints(Math.abs(recommendation.pointsAfterExchange))} 부족`
                    : formatPoints(recommendation.pointsAfterExchange)}
                </dd>
              </dl>

              <p className="mt-3 text-sm font-semibold text-dark-gold">
                {formatTimeFitMessage(
                  recommendation.timeFit,
                  remainingChargingMinutes,
                  recommendation.roundTripMinutes
                )}
              </p>

              <button
                type="button"
                onClick={() => navigate(`${PATHS.map}?store=${store.id}`)}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-button border border-dark-gold/40 bg-card text-sm font-bold text-dark-gold"
              >
                <Navigation size={15} aria-hidden="true" />
                지도에서 매장 위치 보기
              </button>

              <p className="mt-2 text-[11px] text-text-secondary">
                시연용 가상 매장이며, 표시된 원화 금액은 예상 가치입니다.
              </p>
            </Card>
          )}

          <Card>
            <h3 className="mb-1.5 text-[15px] font-bold text-text">상품 설명</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{reward.description}</p>
          </Card>

          <Card>
            <div className="mb-1.5 flex items-center gap-1.5">
              <ListChecks size={16} className="text-text-secondary" aria-hidden="true" />
              <h3 className="text-[15px] font-bold text-text">사용 방법</h3>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {reward.howToUse.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-1.5 flex items-center gap-1.5">
              <CalendarClock size={16} className="text-text-secondary" aria-hidden="true" />
              <h3 className="text-[15px] font-bold text-text">유효기간</h3>
            </div>
            <p className="text-sm text-text-secondary">교환일로부터 {reward.validityDays}일간 사용 가능합니다.</p>
          </Card>

          <Card className="bg-light-yellow">
            <div className="mb-1.5 flex items-center gap-1.5">
              <AlertCircle size={16} className="text-dark-gold" aria-hidden="true" />
              <h3 className="text-[15px] font-bold text-dark-gold">주의사항</h3>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-text">
              {reward.precautions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3">
        <PrimaryButton disabled={!canExchange} onClick={() => navigate(PATHS.rewardExchange(reward.id))}>
          {canExchange ? '교환하기' : '포인트가 부족해요'}
        </PrimaryButton>
      </div>
    </MobileLayout>
  );
}
