import { useParams, useNavigate } from 'react-router-dom';
import { CalendarClock, AlertCircle, ListChecks } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { REWARDS } from '@/data/rewards';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function RewardDetail() {
  const { rewardId } = useParams<{ rewardId: string }>();
  const navigate = useNavigate();
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const reward = REWARDS.find((r) => r.id === rewardId);

  if (!reward) {
    return (
      <MobileLayout title="리워드 상세" showBack showBottomNav={false}>
        <EmptyState title="상품 정보를 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const canExchange = pointsBalance >= reward.requiredPoints;

  return (
    <MobileLayout title={reward.name} showBack showBottomNav={false} noPadding>
      <div className="flex flex-col pb-4">
        <ImageWithFallback src={reward.image} alt={reward.name} className="h-56 w-full object-cover" wrapperClassName="h-56 w-full" />
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div>
            <p className="text-sm text-text-secondary">{reward.brand}</p>
            <h1 className="mt-0.5 text-lg font-extrabold text-text">{reward.name}</h1>
            <p className="mt-2 text-2xl font-extrabold text-dark-gold">{formatPoints(reward.requiredPoints)}</p>
            <p className="mt-1 text-xs text-text-secondary">잔여 {reward.remainingQuantity}개 · 유효기간 {reward.validityDays}일</p>
          </div>

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
