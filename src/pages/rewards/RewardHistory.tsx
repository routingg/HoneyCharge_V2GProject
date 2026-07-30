import { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { FilterChip } from '@/components/common/FilterChip';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { cn } from '@/utils/cn';

const FILTERS = ['전체', '적립', '사용', '만료'] as const;

export default function RewardHistory() {
  const pointsHistory = useAppStore((s) => s.pointsHistory);
  const pointsBalance = useAppStore((s) => s.pointsBalance);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');

  const filtered = useMemo(
    () => (filter === '전체' ? pointsHistory : pointsHistory.filter((p) => p.type === filter)),
    [pointsHistory, filter]
  );

  return (
    <MobileLayout title="포인트 내역" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="bg-light-yellow text-center">
          <p className="text-xs font-semibold text-dark-gold">현재 보유 포인트</p>
          <p className="mt-1 text-2xl font-extrabold text-text">{formatPoints(pointsBalance)}</p>
        </Card>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </FilterChip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="내역이 없어요" />
        ) : (
          <Card padded={false} className="divide-y divide-border">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{item.description}</p>
                  <p className="text-xs text-text-secondary">{item.date}</p>
                </div>
                <p className={cn('shrink-0 text-sm font-bold', item.amount > 0 ? 'text-success' : 'text-danger')}>
                  {item.amount > 0 ? '+' : ''}
                  {formatPoints(item.amount)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
