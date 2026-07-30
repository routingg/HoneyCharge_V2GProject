import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { TextField } from '@/components/common/TextField';
import { Toggle } from '@/components/common/Toggle';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { MANUFACTURERS } from '@/data/vehicles';
import { IMAGES } from '@/data/imageSources';
import { PATHS } from '@/routes/paths';
import type { Vehicle } from '@/types';

export default function VehicleRegister() {
  const navigate = useNavigate();
  const addVehicle = useAppStore((s) => s.addVehicle);
  const setRepresentativeVehicle = useAppStore((s) => s.setRepresentativeVehicle);
  const { showToast } = useToast();

  const manufacturers = Object.keys(MANUFACTURERS);
  const [manufacturer, setManufacturer] = useState(manufacturers[0]);
  const models = useMemo(() => MANUFACTURERS[manufacturer] ?? [], [manufacturer]);
  const [model, setModel] = useState(models[0]);
  const [modelYear, setModelYear] = useState(String(new Date().getFullYear()));
  const [batteryCapacity, setBatteryCapacity] = useState('77.4');
  const [licensePlate, setLicensePlate] = useState('');
  const [connectedCar, setConnectedCar] = useState(true);
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManufacturerChange = (m: string) => {
    setManufacturer(m);
    setModel(MANUFACTURERS[m][0]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      setError('차량 번호를 입력해 주세요');
      return;
    }
    setError(null);
    const id = `vehicle-${Date.now()}`;
    const newVehicle: Vehicle = {
      id,
      isRepresentative,
      manufacturer,
      model,
      modelYear: Number(modelYear),
      batteryCapacityKwh: Number(batteryCapacity),
      licensePlate,
      connected: connectedCar,
      currentSoc: 60,
      estimatedRangeKm: Math.round(Number(batteryCapacity) * 4.2),
      lastChargedAt: '-',
      image: IMAGES.evChargingPlugAngle.url,
      connectedCar,
      stats: {
        totalSessions: 0,
        totalPoints: 0,
        totalChargedKwh: 0,
        totalDischargedKwh: 0,
        carbonSavedKg: 0,
        batteryProtectionGrade: 'A',
      },
      batteryHealth: {
        healthPercent: 100,
        cycleCount: 0,
        fastChargeRatio: 0,
        averageSoc: 60,
        protectionScore: 100,
        recentSoc: Array.from({ length: 7 }).map((_, i) => ({ day: `Day ${i + 1}`, soc: 60 })),
      },
    };
    addVehicle(newVehicle);
    if (isRepresentative) setRepresentativeVehicle(id);
    showToast('차량이 등록되었어요', 'success');
    navigate(PATHS.vehicle, { replace: true });
  };

  return (
    <MobileLayout title="차량 등록" showBack showBottomNav={false}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-4">
        <Card className="flex flex-col gap-4">
          <div>
            <label htmlFor="manufacturer" className="mb-1.5 block text-[13px] font-semibold text-text">
              제조사
            </label>
            <select
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => handleManufacturerChange(e.target.value)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            >
              {manufacturers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="model" className="mb-1.5 block text-[13px] font-semibold text-text">
              차종
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="min-h-[48px] w-full rounded-button border border-border bg-card px-4 text-[15px] text-text"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <TextField label="연식" type="number" value={modelYear} onChange={(e) => setModelYear(e.target.value)} min={2015} max={2027} />
          <TextField
            label="배터리 용량 (kWh)"
            type="number"
            value={batteryCapacity}
            onChange={(e) => setBatteryCapacity(e.target.value)}
            step="0.1"
          />
          <TextField
            label="차량 번호"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            placeholder="12가 3456"
            error={error ?? undefined}
          />
        </Card>

        <Card className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">커넥티드카 연결</p>
            <Toggle checked={connectedCar} onChange={setConnectedCar} label="커넥티드카 연결" />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-sm font-semibold text-text">대표 차량으로 지정</p>
            <Toggle checked={isRepresentative} onChange={setIsRepresentative} label="대표 차량으로 지정" />
          </div>
        </Card>

        <PrimaryButton type="submit">등록하기</PrimaryButton>
      </form>
    </MobileLayout>
  );
}
