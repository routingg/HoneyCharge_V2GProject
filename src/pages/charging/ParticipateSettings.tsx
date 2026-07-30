import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Zap, Coins, Leaf } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Slider } from '@/components/common/Slider';
import { Stepper } from '@/components/common/Stepper';
import { Toggle } from '@/components/common/Toggle';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { BATTERY_LABELS, V2G_EXPLAINER } from '@/utils/formatBatteryText';
import { PATHS } from '@/routes/paths';

export default function ParticipateSettings() {
  const navigate = useNavigate();
  const chargingSettings = useAppStore((s) => s.chargingSettings);
  const updateChargingSettings = useAppStore((s) => s.updateChargingSettings);
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];

  const [targetSoc, setTargetSoc] = useState(chargingSettings.targetSoc);
  const [minSoc, setMinSoc] = useState(chargingSettings.minSoc);
  const [departureTime, setDepartureTime] = useState(chargingSettings.departureTime);
  const [allowV2g, setAllowV2g] = useState(chargingSettings.allowV2g);
  const [autoParticipate, setAutoParticipate] = useState(chargingSettings.autoParticipate);
  const [batteryProtection, setBatteryProtection] = useState(chargingSettings.batteryProtection);
  const [maxDischargeKw, setMaxDischargeKw] = useState(chargingSettings.maxDischargeKw);
  const [notifyChargeComplete, setNotifyChargeComplete] = useState(chargingSettings.notifyChargeComplete);
  const [notifyV2gStart, setNotifyV2gStart] = useState(chargingSettings.notifyV2gStart);
  const [error, setError] = useState<string | null>(null);

  const estimate = useMemo(() => {
    const chargeDeltaPct = Math.max(0, targetSoc - vehicle.currentSoc);
    const dischargeDeltaPct = allowV2g ? Math.min(15, Math.max(0, targetSoc - minSoc) * 0.2) : 0;
    const chargedKwh = (chargeDeltaPct / 100) * vehicle.batteryCapacityKwh;
    const dischargedKwh = allowV2g ? (dischargeDeltaPct / 100) * vehicle.batteryCapacityKwh : 0;
    const points = Math.round(chargedKwh * 38 + dischargedKwh * 55);
    const carbonSavedKg = Math.round((chargedKwh * 0.233 + dischargedKwh * 0.1) * 10) / 10;
    const expectedDepartureSoc = Math.round(targetSoc - dischargeDeltaPct * 0.4);
    return { chargedKwh, dischargedKwh, points, carbonSavedKg, expectedDepartureSoc };
  }, [targetSoc, minSoc, allowV2g, vehicle]);

  const handleNext = () => {
    if (minSoc >= targetSoc) {
      setError('최소 보장 배터리는 목표 충전량보다 낮아야 해요');
      return;
    }
    const now = new Date();
    const [h, m] = departureTime.split(':').map(Number);
    const departure = new Date();
    departure.setHours(h, m, 0, 0);
    if (departure.getTime() <= now.getTime()) {
      setError('출발 시간은 현재 시간보다 이후여야 해요');
      return;
    }
    setError(null);
    updateChargingSettings({
      targetSoc,
      minSoc,
      departureTime,
      allowV2g,
      autoParticipate,
      batteryProtection,
      maxDischargeKw,
      notifyChargeComplete,
      notifyV2gStart,
    });
    navigate(PATHS.participateConfirm);
  };

  return (
    <MobileLayout title="충전 · V2G 참여 설정" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <PageHeader title="충전 목표를 설정해 주세요" subtitle={`현재 배터리 ${vehicle.currentSoc}%`} />

        <Card className="flex flex-col gap-5">
          <Slider
            label={BATTERY_LABELS.target}
            value={targetSoc}
            onChange={setTargetSoc}
            min={minSoc + 5}
            max={100}
            formatValue={(v) => `${v}%`}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">목표 충전량 직접 조정</span>
            <Stepper value={targetSoc} onChange={setTargetSoc} min={minSoc + 5} max={100} unit="%" label={BATTERY_LABELS.target} />
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <Slider
            label={BATTERY_LABELS.minimum}
            value={minSoc}
            onChange={setMinSoc}
            min={5}
            max={targetSoc - 5}
            formatValue={(v) => `${v}%`}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">최소 {minSoc}%는 항상 남겨둘게요</span>
            <Stepper value={minSoc} onChange={setMinSoc} min={5} max={targetSoc - 5} unit="%" label={BATTERY_LABELS.minimum} />
          </div>
        </Card>

        <Card>
          <label htmlFor="departure-time" className="mb-1.5 block text-[13px] font-semibold text-text">
            출발 예정 시간
          </label>
          <input
            id="departure-time"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
          />
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between py-2.5">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold text-text">V2G 참여 허용</p>
              <p className="text-xs text-text-secondary">{V2G_EXPLAINER}</p>
            </div>
            <Toggle checked={allowV2g} onChange={setAllowV2g} label="V2G 방전 허용" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">자동 참여</p>
            <Toggle checked={autoParticipate} onChange={setAutoParticipate} label="자동 참여" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">배터리 보호 모드</p>
            <Toggle checked={batteryProtection} onChange={setBatteryProtection} label="배터리 보호 모드" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-semibold text-text">최대 나눔 출력</p>
              <p className="text-xs text-text-secondary">{allowV2g ? '' : 'V2G를 허용하면 설정할 수 있어요'}</p>
            </div>
            <Stepper
              value={maxDischargeKw}
              onChange={setMaxDischargeKw}
              min={1}
              max={10}
              unit="kW"
              label="최대 방전량"
            />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">충전 완료 알림</p>
            <Toggle checked={notifyChargeComplete} onChange={setNotifyChargeComplete} label="충전 완료 알림" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">V2G 시작 알림</p>
            <Toggle checked={notifyV2gStart} onChange={setNotifyV2gStart} label="V2G 시작 알림" />
          </div>
        </Card>

        <Card className="bg-light-yellow">
          <h3 className="mb-3 text-[15px] font-bold text-dark-gold">실시간 예상 결과</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-dark-gold" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">{BATTERY_LABELS.departure}</p>
                <p className="font-bold text-text">{estimate.expectedDepartureSoc}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun size={16} className="text-dark-gold" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">예상 충전량</p>
                <p className="font-bold text-text">{estimate.chargedKwh.toFixed(1)}kWh</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-dark-gold" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">예상 포인트</p>
                <p className="font-bold text-text">{formatPoints(estimate.points)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-dark-gold" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">탄소 절감</p>
                <p className="font-bold text-text">{estimate.carbonSavedKg}kg</p>
              </div>
            </div>
          </div>
        </Card>

        {error && <p className="text-center text-sm font-medium text-danger">{error}</p>}
        <PrimaryButton onClick={handleNext}>다음</PrimaryButton>
      </div>
    </MobileLayout>
  );
}
