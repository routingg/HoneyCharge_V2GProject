import { BatteryFull, Wifi, WifiOff, Star } from 'lucide-react';
import type { Vehicle } from '@/types';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { cn } from '@/utils/cn';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-card border border-border bg-card p-3 text-left shadow-card active:scale-[0.99]"
    >
      <ImageWithFallback
        src={vehicle.image}
        alt={`${vehicle.manufacturer} ${vehicle.model}`}
        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
        wrapperClassName="h-16 w-16 shrink-0 rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[15px] font-bold text-text">
            {vehicle.manufacturer} {vehicle.model}
          </h3>
          {vehicle.isRepresentative && <Star size={14} className="shrink-0 fill-primary text-primary" aria-hidden="true" />}
        </div>
        <p className="truncate text-xs text-text-secondary">
          {vehicle.modelYear} · {vehicle.licensePlate}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-text">
            <BatteryFull size={13} aria-hidden="true" />
            {vehicle.currentSoc}%
          </span>
          <span className={cn('inline-flex items-center gap-1', vehicle.connected ? 'text-success' : 'text-text-secondary')}>
            {vehicle.connected ? <Wifi size={13} aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}
            {vehicle.connected ? '연결됨' : '연결 안됨'}
          </span>
        </div>
      </div>
    </button>
  );
}
