import { Loader2, LocateFixed } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CurrentLocationButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
}

/** 지도 우하단 FAB — 저장된 기준 위치로 지도를 이동시킨다. */
export function CurrentLocationButton({
  onClick,
  loading = false,
  label = '내 위치로 이동',
  className,
}: CurrentLocationButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={loading}
      disabled={loading}
      onClick={onClick}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-card text-text shadow-elevated disabled:opacity-70',
        className
      )}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin text-info" aria-hidden="true" />
      ) : (
        <LocateFixed size={20} aria-hidden="true" />
      )}
    </button>
  );
}
