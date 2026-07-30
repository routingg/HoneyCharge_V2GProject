import { Zap, MapPin, Star, Heart, BatteryCharging } from 'lucide-react';
import type { Station } from '@/types';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDistance } from '@/utils/calculateDistance';
import { cn } from '@/utils/cn';

interface StationCardProps {
  station: Station;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: () => void;
}

export function StationCard({ station, isFavorite = false, onToggleFavorite, onClick }: StationCardProps) {
  const availTone = station.availableChargers === 0 ? 'danger' : station.availableChargers <= 2 ? 'warning' : 'success';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-card border border-border bg-card p-3 text-left shadow-card active:scale-[0.99]"
    >
      <ImageWithFallback
        src={station.image}
        alt={`${station.name} 전경`}
        className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        wrapperClassName="h-24 w-24 shrink-0 rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-bold text-text">{station.name}</h3>
          {onToggleFavorite && (
            <span
              role="button"
              tabIndex={0}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(station.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onToggleFavorite(station.id);
                }
              }}
              className="shrink-0 p-1"
            >
              <Heart size={18} className={cn(isFavorite ? 'fill-danger text-danger' : 'text-border')} aria-hidden="true" />
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
          <MapPin size={12} aria-hidden="true" />
          {station.address} · {formatDistance(station.distanceKm)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge label={`사용가능 ${station.availableChargers}/${station.totalChargers}`} tone={availTone} />
          {station.v2gAvailable && <StatusBadge label="V2G 가능" tone="neutral" />}
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-dark-gold">
            <Zap size={12} aria-hidden="true" />
            {station.chargeSpeedKw}kW
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-text-secondary">
          <span className="inline-flex items-center gap-0.5">
            <Star size={12} className="fill-primary text-primary" aria-hidden="true" />
            {station.rating} ({station.reviewCount})
          </span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-dark-gold">
            <BatteryCharging size={12} aria-hidden="true" />
            +{station.expectedPoints}P
          </span>
        </div>
      </div>
    </button>
  );
}
