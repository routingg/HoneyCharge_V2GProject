import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TreePine, Leaf, Trophy, Zap, Award } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { useAppStore } from '@/store/useAppStore';

const BADGES = [
  { icon: Leaf, label: '그린 스타터', achieved: true },
  { icon: Zap, label: 'V2G 마스터', achieved: true },
  { icon: TreePine, label: '탄소 절감왕', achieved: true },
  { icon: Trophy, label: '지역 TOP 10', achieved: false },
];

const donutData = [
  { name: '재생에너지', value: 68 },
  { name: '일반 전력', value: 32 },
];
const COLORS = ['#F8C51C', '#EEF0F2'];

export default function Impact() {
  const vehicles = useAppStore((s) => s.vehicles);
  const totalCarbon = vehicles.reduce((sum, v) => sum + v.stats.carbonSavedKg, 0);
  const totalDischarge = vehicles.reduce((sum, v) => sum + v.stats.totalDischargedKwh, 0);
  const totalCharge = vehicles.reduce((sum, v) => sum + v.stats.totalChargedKwh, 0);
  const treeEquivalent = Math.round(totalCarbon / 21);

  return (
    <MobileLayout title="환경 기여 리포트" showBack showBottomNav={false}>
      <div className="flex flex-col gap-4 pb-4">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-light-yellow to-white">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={36} outerRadius={54} startAngle={90} endAngle={-270}>
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-gold">재생에너지 활용 비율</p>
            <p className="text-2xl font-extrabold text-text">68%</p>
            <p className="mt-1 text-xs text-text-secondary">누적 {totalCharge.toFixed(0)}kWh 충전 중</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <Leaf size={18} className="text-success" aria-hidden="true" />
            <p className="mt-1 text-lg font-extrabold text-text">{totalCarbon.toFixed(0)}kg</p>
            <p className="text-xs text-text-secondary">누적 탄소 절감량</p>
          </Card>
          <Card>
            <TreePine size={18} className="text-success" aria-hidden="true" />
            <p className="mt-1 text-lg font-extrabold text-text">나무 {treeEquivalent}그루</p>
            <p className="text-xs text-text-secondary">환산 효과</p>
          </Card>
          <Card>
            <Zap size={18} className="text-info" aria-hidden="true" />
            <p className="mt-1 text-lg font-extrabold text-text">{totalDischarge.toFixed(0)}kWh</p>
            <p className="text-xs text-text-secondary">V2G 공급량</p>
          </Card>
          <Card>
            <Trophy size={18} className="text-dark-gold" aria-hidden="true" />
            <p className="mt-1 text-lg font-extrabold text-text">상위 8%</p>
            <p className="text-xs text-text-secondary">제주 지역 내 순위</p>
          </Card>
        </div>

        <Card>
          <div className="mb-3 flex items-center gap-1.5">
            <Award size={16} className="text-dark-gold" aria-hidden="true" />
            <h3 className="text-[15px] font-bold text-text">환경 배지</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    b.achieved ? 'bg-light-yellow text-dark-gold' : 'bg-bg text-border'
                  }`}
                >
                  <b.icon size={22} aria-hidden="true" />
                </span>
                <span className="text-[11px] text-text-secondary">{b.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
