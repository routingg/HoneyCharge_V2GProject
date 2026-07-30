import { Coins } from 'lucide-react';
import { Card } from './Card';
import { formatPoints } from '@/utils/format';

interface PointCardProps {
  balance: number;
  monthlyEarned: number;
  onViewHistory: () => void;
}

export function PointCard({ balance, monthlyEarned, onViewHistory }: PointCardProps) {
  return (
    <Card className="bg-gradient-to-br from-light-yellow to-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-dark-gold">
            <Coins size={14} aria-hidden="true" />
            보유 포인트
          </div>
          <p className="text-2xl font-extrabold text-text">{formatPoints(balance)}</p>
          <p className="mt-1 text-xs text-text-secondary">이번 달 +{formatPoints(monthlyEarned)} 적립</p>
        </div>
        <button
          type="button"
          onClick={onViewHistory}
          className="min-h-[44px] rounded-button border border-border bg-card px-3.5 text-sm font-semibold text-text"
        >
          내역 보기
        </button>
      </div>
    </Card>
  );
}
