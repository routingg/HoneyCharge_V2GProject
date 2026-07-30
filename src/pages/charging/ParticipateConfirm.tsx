import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { STATIONS } from '@/data/stations';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';
import type { ChargingSession } from '@/types';

const CONNECTED_STATION = STATIONS.find((s) => s.id === 'st-004')!;

export default function ParticipateConfirm() {
  const navigate = useNavigate();
  const chargingSettings = useAppStore((s) => s.chargingSettings);
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const startChargingSession = useAppStore((s) => s.startChargingSession);
  const { showToast } = useToast();
  const [agreed, setAgreed] = useState(false);

  const chargeDeltaPct = Math.max(0, chargingSettings.targetSoc - vehicle.currentSoc);
  const estimatedHours = Math.max(0.3, Math.round((chargeDeltaPct / 100) * vehicle.batteryCapacityKwh / 11 * 10) / 10);
  const estimatedPoints = Math.round(chargeDeltaPct * 38 + (chargingSettings.allowV2g ? 600 : 0));

  const handleStart = () => {
    const now = new Date();
    const completion = new Date(now.getTime() + estimatedHours * 3600 * 1000);
    const session: ChargingSession = {
      id: `session-${Date.now()}`,
      stationName: CONNECTED_STATION.name,
      vehicleId: vehicle.id,
      startedAt: now.toISOString(),
      startSoc: vehicle.currentSoc,
      currentSoc: vehicle.currentSoc,
      targetSoc: chargingSettings.targetSoc,
      minSoc: chargingSettings.minSoc,
      phase: 'charging',
      currentKw: 11,
      totalChargedKwh: 0,
      totalDischargedKwh: 0,
      pointsEarned: 0,
      estimatedCompletionAt: completion.toISOString(),
      isPaused: false,
    };
    startChargingSession(session);
    showToast('충전·V2G 참여를 시작했어요', 'success');
    navigate(PATHS.chargingSession);
  };

  return (
    <MobileLayout title="참여 확인" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card>
          <h3 className="mb-3 text-[15px] font-bold text-text">설정 요약</h3>
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
        </Card>

        <Card>
          <h3 className="mb-2 text-[15px] font-bold text-text">선택 충전소</h3>
          <p className="font-semibold text-text">{CONNECTED_STATION.name}</p>
          <p className="text-sm text-text-secondary">{CONNECTED_STATION.address}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-secondary">예상 충전 시간</p>
              <p className="font-bold text-text">약 {estimatedHours}시간</p>
            </div>
            <div>
              <p className="text-text-secondary">예상 보상</p>
              <p className="font-bold text-dark-gold">{formatPoints(estimatedPoints)}</p>
            </div>
          </div>
        </Card>

        <Card className="border-primary/40 bg-light-yellow">
          <div className="flex gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-dark-gold" aria-hidden="true" />
            <div className="text-sm text-text">
              <p className="font-semibold">참여 전 확인해 주세요</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-text-secondary">
                <li>V2G 방전 중에는 배터리 잔량이 일시적으로 감소할 수 있어요.</li>
                <li>설정한 최소 보장 SOC 이하로는 방전되지 않아요.</li>
                <li>충전 종료 후 정산까지 최대 1일이 소요될 수 있어요.</li>
              </ul>
            </div>
          </div>
        </Card>

        <button type="button" onClick={() => setAgreed((v) => !v)} className="flex min-h-[44px] items-center gap-2.5 text-left">
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', agreed ? 'border-primary bg-primary' : 'border-border')}>
            {agreed && <Check size={13} className="text-[#202124]" aria-hidden="true" />}
          </span>
          <span className="text-sm text-text">위 내용을 확인했으며 참여에 동의합니다</span>
        </button>

        <PrimaryButton disabled={!agreed} onClick={handleStart}>
          참여 시작
        </PrimaryButton>
      </div>
    </MobileLayout>
  );
}
