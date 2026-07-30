import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Star, Activity } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { Toggle } from '@/components/common/Toggle';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Modal } from '@/components/common/Modal';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';

export default function VehicleDetail() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const removeVehicle = useAppStore((s) => s.removeVehicle);
  const setRepresentativeVehicle = useAppStore((s) => s.setRepresentativeVehicle);
  const chargingSettings = useAppStore((s) => s.chargingSettings);
  const updateChargingSettings = useAppStore((s) => s.updateChargingSettings);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (vehicles.length <= 1) {
      showToast('최소 1대의 차량은 등록되어 있어야 해요', 'warning');
      setShowDeleteConfirm(false);
      return;
    }
    removeVehicle(vehicle.id);
    const next = vehicles.find((v) => v.id !== vehicle.id);
    if (next) setRepresentativeVehicle(next.id);
    setShowDeleteConfirm(false);
    showToast('차량이 삭제되었어요', 'success');
    navigate(PATHS.vehicle, { replace: true });
  };

  return (
    <MobileLayout title="차량 상세" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card>
          <div className="flex gap-3">
            <ImageWithFallback
              src={vehicle.image}
              alt={`${vehicle.manufacturer} ${vehicle.model}`}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              wrapperClassName="h-20 w-20 shrink-0 rounded-2xl"
            />
            <div>
              <h2 className="text-base font-extrabold text-text">
                {vehicle.manufacturer} {vehicle.model}
              </h2>
              <p className="text-sm text-text-secondary">
                {vehicle.modelYear}년식 · {vehicle.batteryCapacityKwh}kWh
              </p>
              <p className="text-sm text-text-secondary">{vehicle.licensePlate}</p>
            </div>
          </div>
          {!vehicle.isRepresentative && (
            <button
              type="button"
              onClick={() => {
                setRepresentativeVehicle(vehicle.id);
                showToast('대표 차량으로 변경했어요', 'success');
              }}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-button border border-primary text-sm font-bold text-dark-gold"
            >
              <Star size={15} aria-hidden="true" />
              대표 차량으로 변경
            </button>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-[15px] font-bold text-text">충전 설정</h3>
          <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
            <dt className="text-text-secondary">목표 SOC</dt>
            <dd className="text-right font-semibold text-text">{chargingSettings.targetSoc}%</dd>
            <dt className="text-text-secondary">최소 보장 SOC</dt>
            <dd className="text-right font-semibold text-text">{chargingSettings.minSoc}%</dd>
            <dt className="text-text-secondary">출발 예정 시간</dt>
            <dd className="text-right font-semibold text-text">{chargingSettings.departureTime}</dd>
            <dt className="text-text-secondary">V2G 참여</dt>
            <dd className="text-right font-semibold text-text">{chargingSettings.allowV2g ? '허용' : '미허용'}</dd>
          </dl>
          <SecondaryButton className="mt-3" onClick={() => navigate(PATHS.participate)}>
            충전 설정 변경
          </SecondaryButton>
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <h3 className="pb-2.5 text-[15px] font-bold text-text">알림 설정</h3>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">충전 완료 알림</p>
            <Toggle
              checked={chargingSettings.notifyChargeComplete}
              onChange={(v) => updateChargingSettings({ notifyChargeComplete: v })}
              label="충전 완료 알림"
            />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">V2G 시작 알림</p>
            <Toggle
              checked={chargingSettings.notifyV2gStart}
              onChange={(v) => updateChargingSettings({ notifyV2gStart: v })}
              label="V2G 시작 알림"
            />
          </div>
        </Card>

        <SecondaryButton onClick={() => navigate(PATHS.vehicleBatteryHealth)}>
          <Activity size={16} aria-hidden="true" />
          배터리 분석 보기
        </SecondaryButton>

        <SecondaryButton tone="danger" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={16} aria-hidden="true" />
          차량 삭제
        </SecondaryButton>
      </div>

      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="차량을 삭제할까요?">
        <p className="text-sm text-text-secondary">
          {vehicle.manufacturer} {vehicle.model} 차량이 목록에서 삭제됩니다. 이 작업은 되돌릴 수 없어요.
        </p>
        <div className="mt-4 flex gap-2">
          <SecondaryButton onClick={() => setShowDeleteConfirm(false)}>취소</SecondaryButton>
          <PrimaryButton className="bg-danger text-white" onClick={handleDelete}>
            삭제
          </PrimaryButton>
        </div>
      </Modal>
    </MobileLayout>
  );
}
