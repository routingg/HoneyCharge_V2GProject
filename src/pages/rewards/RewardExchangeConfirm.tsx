import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { REWARDS } from '@/data/rewards';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';
import type { Coupon } from '@/types';

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function RewardExchangeConfirm() {
  const { rewardId } = useParams<{ rewardId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const spendPoints = useAppStore((s) => s.spendPoints);
  const addCoupon = useAppStore((s) => s.addCoupon);
  const reward = REWARDS.find((r) => r.id === rewardId);
  const [agreed, setAgreed] = useState(false);

  if (!reward) {
    return (
      <MobileLayout title="교환 확인" showBack showBottomNav={false}>
        <EmptyState title="상품 정보를 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const afterBalance = pointsBalance - reward.requiredPoints;

  const handleExchange = () => {
    const success = spendPoints(reward.requiredPoints, `${reward.name} 교환`);
    if (!success) {
      showToast('포인트가 부족해요', 'error');
      return;
    }
    const now = new Date();
    const expires = new Date(now.getTime() + reward.validityDays * 86400000);
    const coupon: Coupon = {
      id: `cp-${Date.now()}`,
      rewardId: reward.id,
      rewardName: reward.name,
      brand: reward.brand,
      couponCode: generateCouponCode(),
      exchangedAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      used: false,
    };
    addCoupon(coupon);
    navigate(PATHS.rewardExchangeSuccess);
  };

  return (
    <MobileLayout title="교환 확인" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card>
          <p className="text-sm text-text-secondary">{reward.brand}</p>
          <p className="font-bold text-text">{reward.name}</p>
        </Card>

        <Card>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">현재 포인트</dt>
              <dd className="font-semibold text-text">{formatPoints(pointsBalance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">차감 포인트</dt>
              <dd className="font-semibold text-danger">-{formatPoints(reward.requiredPoints)}</dd>
            </div>
            <div className="my-1 h-px bg-border" />
            <div className="flex justify-between">
              <dt className="font-semibold text-text">교환 후 포인트</dt>
              <dd className="text-lg font-extrabold text-text">{formatPoints(afterBalance)}</dd>
            </div>
          </dl>
        </Card>

        <button type="button" onClick={() => setAgreed((v) => !v)} className="flex min-h-[44px] items-center gap-2.5 text-left">
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', agreed ? 'border-primary bg-primary' : 'border-border')}>
            {agreed && <Check size={13} className="text-[#202124]" aria-hidden="true" />}
          </span>
          <span className="text-sm text-text">교환 내용을 확인했으며, 교환 후 취소가 불가능함에 동의합니다</span>
        </button>

        <PrimaryButton disabled={!agreed} onClick={handleExchange}>
          최종 교환
        </PrimaryButton>
      </div>
    </MobileLayout>
  );
}
