import { useNavigate } from 'react-router-dom';
import { Plus, Wifi, WifiOff, ChevronRight, ShieldCheck } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { StatusBadge } from '@/components/common/StatusBadge';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints, formatKwh, formatKm } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function VehicleMain() {
  const navigate = useNavigate();
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const setRepresentativeVehicle = useAppStore((s) => s.setRepresentativeVehicle);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const others = vehicles.filter((v) => v.id !== vehicle.id);

  return (
    <MobileLayout title="내 차량">
      <div className="flex flex-col gap-4 pb-2">
        <button type="button" onClick={() => navigate(PATHS.vehicleDetail)} className="text-left">
          <Card>
            <div className="flex gap-3">
              <ImageWithFallback
                src={vehicle.image}
                alt={`${vehicle.manufacturer} ${vehicle.model}`}
                className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                wrapperClassName="h-24 w-24 shrink-0 rounded-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-dark-gold">대표 차량</p>
                <h2 className="mt-0.5 text-base font-extrabold text-text">
                  {vehicle.manufacturer} {vehicle.model}
                </h2>
                <p className="text-xs text-text-secondary">{vehicle.batteryCapacityKwh}kWh · {vehicle.modelYear}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge label={`배터리 ${vehicle.currentSoc}%`} tone="neutral" />
                  <StatusBadge
                    label={vehicle.connected ? '연결됨' : '연결 안됨'}
                    tone={vehicle.connected ? 'success' : 'neutral'}
                  />
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 self-center text-text-secondary" aria-hidden="true" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm">
              <div className="flex items-center gap-1.5 text-text-secondary">
                {vehicle.connected ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
                예상 주행거리 {formatKm(vehicle.estimatedRangeKm)}
              </div>
              <div className="text-right text-text-secondary">최근 충전 {vehicle.lastChargedAt}</div>
            </div>
          </Card>
        </button>

        <Card>
          <div className="mb-3 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-success" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">누적 통계</h3>
          </div>
          <div className="grid grid-cols-3 gap-y-3 text-center">
            <div>
              <p className="text-base font-extrabold text-text">{vehicle.stats.totalSessions}회</p>
              <p className="text-[11px] text-text-secondary">참여 횟수</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-dark-gold">{formatPoints(vehicle.stats.totalPoints)}</p>
              <p className="text-[11px] text-text-secondary">누적 포인트</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-text">{vehicle.stats.batteryProtectionGrade}등급</p>
              <p className="text-[11px] text-text-secondary">보호 등급</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-text">{formatKwh(vehicle.stats.totalChargedKwh)}</p>
              <p className="text-[11px] text-text-secondary">누적 충전량</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-text">{formatKwh(vehicle.stats.totalDischargedKwh)}</p>
              <p className="text-[11px] text-text-secondary">누적 방전량</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-success">{vehicle.stats.carbonSavedKg}kg</p>
              <p className="text-[11px] text-text-secondary">탄소 절감</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(PATHS.vehicleBatteryHealth)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-button border border-border text-sm font-semibold text-text"
          >
            배터리 분석 보기
          </button>
        </Card>

        <PageHeader
          title="전체 차량"
          action={
            <button
              type="button"
              onClick={() => navigate(PATHS.vehicleRegister)}
              className="flex min-h-[40px] items-center gap-1 rounded-full bg-primary px-3.5 text-sm font-bold text-[#202124]"
            >
              <Plus size={15} aria-hidden="true" />
              차량 등록
            </button>
          }
        />
        <div className="flex flex-col gap-2.5">
          <VehicleCard vehicle={vehicle} onClick={() => navigate(PATHS.vehicleDetail)} />
          {others.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onClick={() => setRepresentativeVehicle(v.id)} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
