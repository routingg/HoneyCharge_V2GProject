import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, TrendingUp, Award, Wallet, Clock3 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { RewardCard } from '@/components/rewards/RewardCard';
import { EmptyState } from '@/components/common/EmptyState';
import { REWARDS, REWARD_CATEGORIES } from '@/data/rewards';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function RewardsHome() {
  const navigate = useNavigate();
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const [category, setCategory] = useState<string>('전체');

  const filteredRewards = useMemo(
    () => (category === '전체' ? REWARDS : REWARDS.filter((r) => r.category === category)),
    [category]
  );

  return (
    <MobileLayout>
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
              <p className="mt-1 text-sm font-bold text-text">18,200원</p>
              <p className="text-[11px] text-text-secondary">예상 정산금</p>
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
      </div>
    </MobileLayout>
  );
}
