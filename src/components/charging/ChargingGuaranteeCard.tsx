import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CalendarClock,
  ChevronRight,
  Clock,
  Gauge,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { IMAGES } from '@/data/imageSources';
import type { ChargingGuaranteeResult, GuaranteeStatus } from '@/utils/chargingGuarantee';
import { BATTERY_LABELS } from '@/utils/formatBatteryText';

const BADGE_TONE: Record<GuaranteeStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  guaranteed: 'success',
  charging: 'warning',
  reached: 'success',
  attention: 'danger',
  'not-set': 'neutral',
};

interface ChargingGuaranteeCardProps {
  guarantee: ChargingGuaranteeResult;
  currentBatteryPercent: number;
  targetBatteryPercent: number;
  minimumBatteryPercent: number;
  departureTime: string;
  onViewPlan: () => void;
  onChangeSettings: () => void;
  onLowerTarget: () => void;
  onDelayDeparture: () => void;
  onFindFastStation: () => void;
}

/** 홈 최상단 "충전 보장" 히어로 카드 */
export function ChargingGuaranteeCard({
  guarantee,
  currentBatteryPercent,
  targetBatteryPercent,
  minimumBatteryPercent,
  departureTime,
  onViewPlan,
  onChangeSettings,
  onLowerTarget,
  onDelayDeparture,
  onFindFastStation,
}: ChargingGuaranteeCardProps) {
  const highlights = [
    guarantee.departureTimeLabel,
    guarantee.recommendedStartLabel,
    `${Math.round(targetBatteryPercent)}%`,
    `${Math.round(minimumBatteryPercent)}%`,
  ];

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="relative">
        <ImageWithFallback
          src={IMAGES.evChargingPlugCloseup.url}
          alt={IMAGES.evChargingPlugCloseup.alt}
          className="h-40 w-full object-cover"
          wrapperClassName="h-40 w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="inline-flex items-center gap-1 rounded-chip bg-white/90 px-2.5 py-1 text-[11px] font-bold text-dark-gold">
            <ShieldCheck size={12} aria-hidden="true" />
            충전 보장
          </span>
          <StatusBadge label={guarantee.statusLabel} tone={BADGE_TONE[guarantee.guaranteeStatus]} />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[21px] font-extrabold leading-snug text-white">
            {highlight(guarantee.displayMessage, highlights)}
          </p>
          <p className="mt-1.5 text-xs text-white/85">{guarantee.subMessages.join(' · ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3 p-4">
        <Metric icon={<CalendarClock size={14} />} label="출발 예정 시간" value={guarantee.departureTimeLabel} sub={departureTime} />
        <Metric icon={<Gauge size={14} />} label={BATTERY_LABELS.target} value={`${Math.round(targetBatteryPercent)}%`} />
        <Metric
          icon={<BatteryCharging size={14} />}
          label={BATTERY_LABELS.current}
          value={`${Math.round(currentBatteryPercent)}%`}
        />
        <Metric icon={<Clock size={14} />} label="예상 충전 완료" value={guarantee.estimatedCompletionLabel} />
        <Metric
          icon={<ShieldCheck size={14} />}
          label={BATTERY_LABELS.minimum}
          value={`${Math.round(minimumBatteryPercent)}%`}
        />
        <Metric
          icon={<Zap size={14} />}
          label={BATTERY_LABELS.departure}
          value={`약 ${guarantee.estimatedDepartureBattery}%`}
          highlighted
        />
      </div>

      {guarantee.warningMessage && (
        <div className="mx-4 mb-4 rounded-2xl bg-danger/5 p-3">
          <p className="flex items-start gap-1.5 text-sm font-semibold text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {guarantee.warningMessage}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <ActionChip onClick={onLowerTarget}>목표 충전량 낮추기</ActionChip>
            <ActionChip onClick={onDelayDeparture}>출발 시간 늦추기</ActionChip>
            <ActionChip onClick={onFindFastStation}>급속 충전소 찾기</ActionChip>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={onViewPlan}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-button bg-light-yellow text-sm font-bold text-dark-gold"
        >
          충전 계획 보기
          <ChevronRight size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onChangeSettings}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-button border border-border text-sm font-bold text-text"
        >
          설정 변경
        </button>
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  highlighted = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlighted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] text-text-secondary">
        <span className="shrink-0 text-text-secondary" aria-hidden="true">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </p>
      <p className={`mt-0.5 truncate text-[15px] font-extrabold ${highlighted ? 'text-dark-gold' : 'text-text'}`}>
        {value}
      </p>
      {sub && <p className="truncate text-[11px] text-text-secondary">{sub}</p>}
    </div>
  );
}

function ActionChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[34px] items-center rounded-chip border border-danger/30 bg-card px-3 text-[12px] font-bold text-danger"
    >
      {children}
    </button>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 핵심 수치(시간·퍼센트)를 브랜드 컬러로 강조한다. */
function highlight(message: string, parts: string[]): ReactNode {
  const unique = Array.from(new Set(parts.filter(Boolean))).sort((a, b) => b.length - a.length);
  if (unique.length === 0) return message;
  const pattern = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'g');
  return message.split(pattern).map((chunk, i) =>
    unique.includes(chunk) ? (
      <span key={`${chunk}-${i}`} className="text-primary">
        {chunk}
      </span>
    ) : (
      <span key={`t-${i}`}>{chunk}</span>
    )
  );
}
