import { MapPin, Zap } from 'lucide-react';
import type { Station } from '@/types';
import { Card } from '@/components/common/Card';
import { formatDistance } from '@/utils/calculateDistance';

interface SelectedStationSummaryProps {
  station: Station | null;
  onChange: () => void;
  onClick?: () => void;
}

/** 홈 등에서 "현재 기준 충전소"를 보여주는 요약 줄 */
export function SelectedStationSummary({ station, onChange, onClick }: SelectedStationSummaryProps) {
  return (
    <Card className="flex items-center gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
        <MapPin size={16} aria-hidden="true" />
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick || !station}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className="text-[11px] font-semibold text-text-secondary">현재 기준 충전소</p>
        {station ? (
          <>
            <p className="truncate text-sm font-bold text-text">{station.name}</p>
            <p className="flex items-center gap-1 truncate text-[11px] text-text-secondary">
              {formatDistance(station.distanceKm)}
              <span aria-hidden="true">·</span>
              <Zap size={10} aria-hidden="true" />
              {station.chargeSpeedKw}kW
            </p>
          </>
        ) : (
          <p className="truncate text-sm font-bold text-text">충전소를 선택해 주세요</p>
        )}
      </button>
      <button
        type="button"
        onClick={onChange}
        className="min-h-[36px] shrink-0 rounded-chip border border-border px-3 text-xs font-bold text-text"
      >
        변경
      </button>
    </Card>
  );
}
