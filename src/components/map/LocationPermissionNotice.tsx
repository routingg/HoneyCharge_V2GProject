import { Crosshair, Hotel, Loader2 } from 'lucide-react';
import type { LocationSource } from '@/types';
import { LOCATION_LOADING_MESSAGE } from '@/utils/location';
import { cn } from '@/utils/cn';

interface LocationPermissionNoticeProps {
  source: LocationSource;
  loading: boolean;
  onUseBrowserLocation: () => void;
  onUseHotelLocation: () => void;
  className?: string;
}

/**
 * 실제 위치 사용 / 호텔 기준 전환 버튼.
 * 데모 모드에서도 사용자가 원하면 실제 위치를 켤 수 있게 항상 노출한다.
 */
export function LocationPermissionNotice({
  source,
  loading,
  onUseBrowserLocation,
  onUseHotelLocation,
  className,
}: LocationPermissionNoticeProps) {
  if (loading) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-chip bg-card px-2.5 py-1 text-[11px] font-bold text-info shadow-card',
          className
        )}
        role="status"
      >
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        {LOCATION_LOADING_MESSAGE}
      </span>
    );
  }

  if (source === 'browser') {
    return (
      <button
        type="button"
        onClick={onUseHotelLocation}
        className={cn(
          'inline-flex min-h-[28px] shrink-0 items-center gap-1 whitespace-nowrap rounded-chip bg-card px-2.5 py-1 text-[11px] font-bold text-text-secondary shadow-card',
          className
        )}
      >
        <Hotel size={12} aria-hidden="true" />
        호텔 기준으로 보기
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onUseBrowserLocation}
      className={cn(
        'inline-flex min-h-[28px] shrink-0 items-center gap-1 whitespace-nowrap rounded-chip bg-info px-2.5 py-1 text-[11px] font-bold text-white shadow-card',
        className
      )}
    >
      <Crosshair size={12} aria-hidden="true" />
      실제 위치 사용
    </button>
  );
}
