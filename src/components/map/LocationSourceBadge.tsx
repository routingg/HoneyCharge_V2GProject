import { Crosshair, Hotel, PlayCircle } from 'lucide-react';
import type { LocationSource } from '@/types';
import { LOCATION_SOURCE_LABEL } from '@/utils/location';
import { cn } from '@/utils/cn';

const ICONS: Record<LocationSource, typeof Crosshair> = {
  browser: Crosshair,
  'hotel-default': Hotel,
  demo: PlayCircle,
};

const TONES: Record<LocationSource, string> = {
  browser: 'bg-info/10 text-info',
  'hotel-default': 'bg-light-yellow text-dark-gold',
  demo: 'bg-[#EEF0F2] text-text-secondary',
};

interface LocationSourceBadgeProps {
  source: LocationSource;
  className?: string;
}

/** 지도 상단에서 "지금 어떤 위치 기준으로 보고 있는지" 알려주는 상태 배지 */
export function LocationSourceBadge({ source, className }: LocationSourceBadgeProps) {
  const Icon = ICONS[source];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-chip px-2.5 py-1 text-[11px] font-bold shadow-card',
        TONES[source],
        className
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {LOCATION_SOURCE_LABEL[source]}
    </span>
  );
}
