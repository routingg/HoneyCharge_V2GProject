import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { HeartPulse, Lightbulb } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ChartCard } from '@/components/charts/ChartCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { useAppStore } from '@/store/useAppStore';

const TIPS = [
  '급속 충전보다 완속 충전을 자주 이용하면 배터리 수명에 도움이 돼요.',
  '배터리 잔량을 20~80% 사이로 유지하면 열화를 줄일 수 있어요.',
  '장시간 주차 시에는 50% 내외로 충전해 두는 것이 좋아요.',
  '한여름·한겨울에는 급속 충전 직후 바로 출발하지 않는 것이 좋아요.',
];

export default function BatteryHealth() {
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const health = vehicle.batteryHealth;

  return (
    <MobileLayout title="배터리 분석" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card>
          <div className="flex items-center gap-1.5">
            <HeartPulse size={18} className="text-success" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">배터리 건강도</h3>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-text">{health.healthPercent}%</p>
          <ProgressBar percent={health.healthPercent} className="mt-2 bg-success" label="배터리 건강도" />
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-secondary">충전 사이클</p>
            <p className="mt-1 text-lg font-extrabold text-text">{health.cycleCount}회</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">급속 충전 비율</p>
            <p className="mt-1 text-lg font-extrabold text-text">{health.fastChargeRatio}%</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">평균 SOC</p>
            <p className="mt-1 text-lg font-extrabold text-text">{health.averageSoc}%</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">배터리 보호 점수</p>
            <p className="mt-1 text-lg font-extrabold text-dark-gold">{health.protectionScore}점</p>
          </Card>
        </div>

        <ChartCard title="최근 7일 SOC 추이">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={health.recentSoc} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F2" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#70757A' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#70757A' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E8EA' }} />
                <Line type="monotone" dataKey="soc" stroke="#1976D2" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="bg-light-yellow">
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb size={16} className="text-dark-gold" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-dark-gold">배터리 관리 팁</h3>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-text">
            {TIPS.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </Card>
      </div>
    </MobileLayout>
  );
}
