import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ChartCard } from '@/components/charts/ChartCard';
import { DAILY_ENERGY, HOURLY_ENERGY } from '@/data/energyData';
import { formatPoints } from '@/utils/format';

const thisMonth = DAILY_ENERGY.slice(16);
const lastMonth = DAILY_ENERGY.slice(0, 16);

function sum(arr: typeof DAILY_ENERGY, key: 'chargedKwh' | 'dischargedKwh' | 'points' | 'carbonSavedKg') {
  return arr.reduce((s, d) => s + d[key], 0);
}

function pctChange(current: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((current - prev) / prev) * 100);
}

export default function MonthlyReport() {
  const chargedNow = sum(thisMonth, 'chargedKwh');
  const chargedPrev = sum(lastMonth, 'chargedKwh');
  const dischargedNow = sum(thisMonth, 'dischargedKwh');
  const pointsNow = sum(thisMonth, 'points');
  const carbonNow = sum(thisMonth, 'carbonSavedKg');
  const chargeChange = pctChange(chargedNow, chargedPrev);

  const hourlyChart = HOURLY_ENERGY.map((h) => ({
    hour: `${h.hour}시`,
    '배터리 잔량': h.socForecast,
    재생에너지: h.renewableRatio,
  }));

  return (
    <MobileLayout title="월간 리포트" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-secondary">이번 달 충전량</p>
            <p className="mt-1 text-lg font-extrabold text-text">{chargedNow.toFixed(0)}kWh</p>
            <p className={`mt-0.5 flex items-center gap-0.5 text-xs font-semibold ${chargeChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {chargeChange >= 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
              지난달 대비 {Math.abs(chargeChange)}%
            </p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">전력망에 나눈 양</p>
            <p className="mt-1 text-lg font-extrabold text-text">{dischargedNow.toFixed(0)}kWh</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">이번 달 포인트</p>
            <p className="mt-1 text-lg font-extrabold text-dark-gold">{formatPoints(pointsNow)}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-secondary">이번 달 탄소 절감량</p>
            <p className="mt-1 text-lg font-extrabold text-success">{carbonNow.toFixed(0)}kg</p>
          </Card>
        </div>

        <ChartCard title="일별 충전 · 방전량" subtitle="최근 16일">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thisMonth} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F2" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#70757A' }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#70757A' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E8EA' }} />
                <Bar dataKey="chargedKwh" name="충전량" fill="#F8C51C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dischargedKwh" name="방전량" fill="#1976D2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="시간대별 배터리 잔량 · 재생에너지 비율">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChart} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F2" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#70757A' }} interval={2} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#70757A' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E7E8EA' }} />
                <Line type="monotone" dataKey="배터리 잔량" stroke="#1976D2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="재생에너지" stroke="#B88A00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="bg-light-yellow">
          <div className="flex items-start gap-2">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-dark-gold" aria-hidden="true" />
            <p className="text-sm text-text">
              이번 달 재생에너지 활용 비율이 지난달보다 높아졌어요. 오후 1시~4시 태양광 충전을 조금 더 활용하면 더 많은 포인트를 받을 수 있어요.
            </p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
