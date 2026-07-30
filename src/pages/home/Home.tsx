import { useNavigate } from 'react-router-dom';
import { Sun, Wind, Clock, Coins, Leaf, TreePine, Repeat, ChevronRight, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { BatteryGauge } from '@/components/charging/BatteryGauge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { AI_SCHEDULES } from '@/data/aiSchedules';
import { IMAGES } from '@/data/imageSources';
import { CHARGING_HISTORY } from '@/data/chargingHistory';
import { POINTS_HISTORY } from '@/data/pointsHistory';
import { RESERVATIONS } from '@/data/reservations';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function Home() {
  const navigate = useNavigate();
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const chargingSession = useAppStore((s) => s.chargingSession);
  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const schedule = AI_SCHEDULES[0];
  const isCharging = chargingSession && chargingSession.phase !== 'completed';

  const recentActivities = [
    {
      key: 'charge',
      icon: Zap,
      title: `${CHARGING_HISTORY[0].stationName} 충전 완료`,
      meta: CHARGING_HISTORY[0].date,
      onClick: () => navigate(PATHS.vehicle),
    },
    {
      key: 'points',
      icon: Coins,
      title: POINTS_HISTORY[0].description,
      meta: `${POINTS_HISTORY[0].amount > 0 ? '+' : ''}${formatPoints(POINTS_HISTORY[0].amount)}`,
      onClick: () => navigate(PATHS.rewardHistory),
    },
    {
      key: 'reservation',
      icon: Clock,
      title: `${RESERVATIONS[0].stationName} 예약`,
      meta: `${RESERVATIONS[0].date} ${RESERVATIONS[0].time}`,
      onClick: () => navigate(PATHS.stationDetail(RESERVATIONS[0].stationId)),
    },
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4 pb-2">
        {/* Hero card */}
        <button
          type="button"
          onClick={() => navigate(PATHS.aiSchedule)}
          className="relative overflow-hidden rounded-card text-left shadow-card"
        >
          <ImageWithFallback
            src={IMAGES.evChargingPlugCloseup.url}
            alt={IMAGES.evChargingPlugCloseup.alt}
            className="h-44 w-full object-cover"
            wrapperClassName="h-44 w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-xs font-semibold text-primary">오늘 {schedule.departureTime} 출발 예정</p>
            <p className="mt-1 text-lg font-extrabold">출발 시 예상 배터리 {schedule.expectedDepartureSoc}%</p>
            <p className="mt-0.5 text-sm text-white/85">오늘 최대 {formatPoints(schedule.estimatedPoints)} 적립 가능</p>
          </div>
        </button>

        {/* Battery status card */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                {vehicle.manufacturer} {vehicle.model}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge label={isCharging ? '충전 중' : vehicle.connected ? '연결됨' : '연결 안됨'} tone={isCharging ? 'warning' : vehicle.connected ? 'success' : 'neutral'} />
                <StatusBadge label={`최소 ${20}%`} tone="neutral" />
                <StatusBadge label={`목표 ${80}%`} tone="neutral" />
              </div>
              <button
                type="button"
                onClick={() => navigate(PATHS.vehicleDetail)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-info"
              >
                차량 상세 보기
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
            <BatteryGauge soc={vehicle.currentSoc} minSoc={20} targetSoc={80} charging={!!isCharging} size={132} />
          </div>
        </Card>

        {/* AI recommendation card */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-text">AI 충전 추천</h3>
            <StatusBadge label={schedule.weather} tone="neutral" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-2xl bg-bg p-3">
              <Sun size={18} className="text-primary-gold" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">예상 충전 시간</p>
                <p className="font-bold text-text">{schedule.estimatedChargeHours}시간</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-bg p-3">
              <Wind size={18} className="text-info" aria-hidden="true" />
              <div>
                <p className="text-xs text-text-secondary">예상 V2G 시간</p>
                <p className="font-bold text-text">{schedule.estimatedV2gHours}시간</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(PATHS.aiSchedule)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-button bg-light-yellow text-sm font-bold text-dark-gold"
          >
            추천 자세히 보기
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </Card>

        {/* Environmental impact card */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-text">환경 기여 현황</h3>
            <Leaf size={18} className="text-success" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-extrabold text-text">2,140</p>
              <p className="text-[11px] text-text-secondary">재생에너지(kWh)</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-text">512</p>
              <p className="text-[11px] text-text-secondary">탄소 절감(kg)</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-text">36</p>
              <p className="text-[11px] text-text-secondary">V2G 참여(회)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(PATHS.impact)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-button border border-border text-sm font-bold text-text"
          >
            <TreePine size={16} aria-hidden="true" />
            기여 리포트 보기
          </button>
        </Card>

        {/* Recent activity */}
        <Card>
          <h3 className="mb-3 text-[15px] font-bold text-text">최근 활동</h3>
          <div className="flex flex-col divide-y divide-border">
            {recentActivities.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="flex min-h-[52px] w-full items-center gap-3 py-2.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
                  <item.icon size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">{item.title}</span>
                  <span className="block text-xs text-text-secondary">{item.meta}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(PATHS.rewardHistory)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-info"
          >
            <Repeat size={12} aria-hidden="true" />
            전체 내역 보기
          </button>
        </Card>
      </div>
    </MobileLayout>
  );
}
