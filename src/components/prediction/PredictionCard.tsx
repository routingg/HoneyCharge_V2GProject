import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';

interface PredictionCardProps {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
  accentClassName?: string;
  /** 전체 대비 비율 막대 (0~1). 생략하면 막대를 그리지 않는다. */
  ratio?: number;
}

/** 예측값 1건을 보여주는 카드. 기존 디자인 토큰(rounded-card, shadow-card)만 재사용한다. */
export function PredictionCard({
  label,
  value,
  unit,
  icon,
  accentClassName = 'text-text',
  ratio,
}: PredictionCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className={`text-2xl font-extrabold tabular-nums ${accentClassName}`}>
        {value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}
        <span className="ml-1 text-sm font-semibold text-text-secondary">{unit}</span>
      </p>
      {ratio !== undefined && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF0F2]">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
          />
        </div>
      )}
    </Card>
  );
}
