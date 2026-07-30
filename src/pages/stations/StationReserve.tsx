import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { Slider } from '@/components/common/Slider';
import { Stepper } from '@/components/common/Stepper';
import { Toggle } from '@/components/common/Toggle';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { STATIONS } from '@/data/stations';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import type { ConnectorType, Reservation } from '@/types';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StationReserve() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const addReservation = useAppStore((s) => s.addReservation);
  const station = STATIONS.find((s) => s.id === stationId);

  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('14:00');
  const [vehicleId, setVehicleId] = useState(representativeVehicleId);
  const [chargerType, setChargerType] = useState<ConnectorType | ''>(station?.connectorTypes[0] ?? '');
  const [stayMin, setStayMin] = useState(60);
  const [targetSoc, setTargetSoc] = useState(80);
  const [v2gParticipate, setV2gParticipate] = useState(!!station?.v2gAvailable);

  const expectedPoints = useMemo(() => {
    if (!station) return 0;
    return Math.round(station.expectedPoints * (targetSoc / 80) * (v2gParticipate ? 1.2 : 1));
  }, [station, targetSoc, v2gParticipate]);

  if (!station) {
    return (
      <MobileLayout title="충전 예약" showBack showBottomNav={false}>
        <EmptyState title="충전소 정보를 찾을 수 없어요" />
      </MobileLayout>
    );
  }

  const handleReserve = () => {
    const reservation: Reservation = {
      id: `rs-${Date.now()}`,
      stationId: station.id,
      stationName: station.name,
      date,
      time,
      vehicleId,
      chargerType: (chargerType || station.connectorTypes[0]) as ConnectorType,
      expectedStayMin: stayMin,
      targetSoc,
      v2gParticipate,
      expectedPoints,
      status: '예약완료',
      createdAt: todayStr(),
    };
    addReservation(reservation);
    showToast('예약이 완료되었어요', 'success');
    navigate(PATHS.reservationSuccess);
  };

  return (
    <MobileLayout title="충전 예약" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card>
          <p className="text-sm text-text-secondary">예약 충전소</p>
          <p className="font-bold text-text">{station.name}</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <label htmlFor="rsv-date" className="mb-1.5 block text-[13px] font-semibold text-text">
              예약 날짜
            </label>
            <input
              id="rsv-date"
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            />
          </div>
          <div>
            <label htmlFor="rsv-time" className="mb-1.5 block text-[13px] font-semibold text-text">
              예약 시간
            </label>
            <input
              id="rsv-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            />
          </div>
          <div>
            <label htmlFor="rsv-vehicle" className="mb-1.5 block text-[13px] font-semibold text-text">
              차량 선택
            </label>
            <select
              id="rsv-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.manufacturer} {v.model} ({v.licensePlate})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rsv-charger" className="mb-1.5 block text-[13px] font-semibold text-text">
              충전기 선택
            </label>
            <select
              id="rsv-charger"
              value={chargerType}
              onChange={(e) => setChargerType(e.target.value as ConnectorType)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            >
              {station.connectorTypes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text">예상 체류 시간</span>
            <Stepper value={stayMin} onChange={setStayMin} min={30} max={240} step={15} unit="분" label="예상 체류 시간" />
          </div>
          <Slider label="목표 충전량" value={targetSoc} onChange={setTargetSoc} min={30} max={100} formatValue={(v) => `${v}%`} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">V2G 참여</p>
              {!station.v2gAvailable && <p className="text-xs text-text-secondary">이 충전소는 V2G를 지원하지 않아요</p>}
            </div>
            <Toggle checked={v2gParticipate} onChange={setV2gParticipate} disabled={!station.v2gAvailable} label="V2G 참여" />
          </div>
        </Card>

        <Card className="bg-light-yellow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-dark-gold">예상 포인트</p>
            <p className="text-xl font-extrabold text-dark-gold">{formatPoints(expectedPoints)}</p>
          </div>
        </Card>

        <PrimaryButton onClick={handleReserve}>예약하기</PrimaryButton>
      </div>
    </MobileLayout>
  );
}
