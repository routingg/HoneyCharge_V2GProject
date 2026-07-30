import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Wind, Clock, Coins, Leaf, TreePine, Repeat, ChevronRight, Zap } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/common/Card';
import { BatteryGauge } from '@/components/charging/BatteryGauge';
import { ChargingGuaranteeCard } from '@/components/charging/ChargingGuaranteeCard';
import { SelectedStationSummary } from '@/components/stations/SelectedStationSummary';
import { NearbyRewardSection } from '@/components/rewards/NearbyRewardSection';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { AI_SCHEDULES } from '@/data/aiSchedules';
import { STATIONS } from '@/data/stations';
import { CHARGING_HISTORY } from '@/data/chargingHistory';
import { POINTS_HISTORY } from '@/data/pointsHistory';
import { RESERVATIONS } from '@/data/reservations';
import { formatPoints } from '@/utils/format';
import { applyDistances } from '@/utils/calculateDistance';
import { effectiveChargingPowerKw, resolveSelectedStation } from '@/utils/stationFilters';
import { calculateChargingGuarantee, estimateV2gDischargeKwh } from '@/utils/chargingGuarantee';
import { BATTERY_LABELS, formatKoreanClock } from '@/utils/formatBatteryText';
import { PATHS } from '@/routes/paths';

/** "HH:mm"에 분 단위를 더한다(24시 넘어가면 순환). */
function shiftTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const vehicles = useAppStore((s) => s.vehicles);
  const representativeVehicleId = useAppStore((s) => s.representativeVehicleId);
  const chargingSession = useAppStore((s) => s.chargingSession);
  const chargingSettings = useAppStore((s) => s.chargingSettings);
  const updateChargingSettings = useAppStore((s) => s.updateChargingSettings);
  const userLocation = useAppStore((s) => s.userLocation);
  const selectedStationId = useAppStore((s) => s.selectedStationId);

  const vehicle = vehicles.find((v) => v.id === representativeVehicleId) ?? vehicles[0];
  const schedule = AI_SCHEDULES[0];
  const isCharging = !!chargingSession && chargingSession.phase !== 'completed';

  const selectedStation = useMemo(
    () => resolveSelectedStation(applyDistances(STATIONS, userLocation), selectedStationId, userLocation),
    [userLocation, selectedStationId]
  );

  const currentBattery = chargingSession ? chargingSession.currentSoc : vehicle.currentSoc;
  const targetBattery = chargingSession ? chargingSession.targetSoc : chargingSettings.targetSoc;
  const minimumBattery = chargingSession ? chargingSession.minSoc : chargingSettings.minSoc;

  const phase = !chargingSession
    ? 'idle'
    : chargingSession.isPaused
      ? 'paused'
      : chargingSession.phase;

  const guarantee = useMemo(() => {
    const power = effectiveChargingPowerKw(selectedStation);
    const now = new Date();
    const preview = calculateChargingGuarantee({
      currentBatteryPercent: currentBattery,
      targetBatteryPercent: targetBattery,
      minimumBatteryPercent: minimumBattery,
      departureTime: chargingSettings.departureTime,
      chargingPowerKw: power,
      batteryCapacityKwh: vehicle.batteryCapacityKwh,
      v2gEnabled: false,
      phase,
      hasSettings: !!chargingSettings.departureTime,
      now,
    });
    // V2G 예상 방전량을 반영해 한 번 더 계산한다
    return calculateChargingGuarantee({
      currentBatteryPercent: currentBattery,
      targetBatteryPercent: targetBattery,
      minimumBatteryPercent: minimumBattery,
      departureTime: chargingSettings.departureTime,
      chargingPowerKw: power,
      batteryCapacityKwh: vehicle.batteryCapacityKwh,
      v2gEnabled: chargingSettings.allowV2g,
      estimatedDischargeKwh: estimateV2gDischargeKwh({
        maxDischargeKw: chargingSettings.maxDischargeKw,
        minutesUntilDeparture: preview.minutesUntilDeparture,
        requiredChargingMinutes: preview.requiredMinutes,
      }),
      phase,
      hasSettings: !!chargingSettings.departureTime,
      now,
    });
  }, [selectedStation, currentBattery, targetBattery, minimumBattery, chargingSettings, vehicle, phase]);

  const handleLowerTarget = () => {
    const next = Math.max(minimumBattery + 5, targetBattery - 10);
    if (next === targetBattery) {
      showToast('목표 충전량을 더 낮출 수 없어요', 'warning');
      return;
    }
    updateChargingSettings({ targetSoc: next });
    showToast(`목표 충전량을 ${next}%로 낮췄어요`, 'success');
  };

  const handleDelayDeparture = () => {
    const next = shiftTime(chargingSettings.departureTime, 60);
    updateChargingSettings({ departureTime: next });
    showToast(`출발 시간을 ${formatKoreanClock(next)}으로 미뤘어요`, 'success');
  };

  const handleFindFastStation = () => {
    navigate(`${PATHS.map}?filter=fast`);
  };

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
        {/* 충전 보장 히어로 */}
        <ChargingGuaranteeCard
          guarantee={guarantee}
          currentBatteryPercent={currentBattery}
          targetBatteryPercent={targetBattery}
          minimumBatteryPercent={minimumBattery}
          departureTime={chargingSettings.departureTime}
          onViewPlan={() => navigate(PATHS.aiSchedule)}
          onChangeSettings={() => navigate(PATHS.participate)}
          onLowerTarget={handleLowerTarget}
          onDelayDeparture={handleDelayDeparture}
          onFindFastStation={handleFindFastStation}
        />

        {/* 현재 기준 충전소 */}
        <SelectedStationSummary
          station={selectedStation}
          onChange={() => navigate(PATHS.map)}
          onClick={selectedStation ? () => navigate(PATHS.stationDetail(selectedStation.id)) : undefined}
        />

        {/* 배터리 상태 */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-secondary">
                {vehicle.manufacturer} {vehicle.model}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge
                  label={isCharging ? '충전 중' : vehicle.connected ? '연결됨' : '연결 안됨'}
                  tone={isCharging ? 'warning' : vehicle.connected ? 'success' : 'neutral'}
                />
                <StatusBadge label={`${BATTERY_LABELS.minimum} ${minimumBattery}%`} tone="neutral" />
                <StatusBadge label={`${BATTERY_LABELS.target} ${targetBattery}%`} tone="neutral" />
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
            <BatteryGauge
              soc={currentBattery}
              minSoc={minimumBattery}
              targetSoc={targetBattery}
              charging={isCharging}
              size={128}
              label={BATTERY_LABELS.level}
            />
          </div>
        </Card>

        {/* 충전소 근처 추천 혜택 */}
        <NearbyRewardSection
          stationId={selectedStation?.id ?? null}
          title="충전소 근처 추천 혜택"
          description="충전하는 동안 이용하기 좋은 장소를 골랐어요"
          limit={3}
          variant="scroll"
          remainingChargingMinutes={
            isCharging && chargingSession
              ? Math.max(
                  0,
                  Math.round((new Date(chargingSession.estimatedCompletionAt).getTime() - Date.now()) / 60000)
                )
              : null
          }
          onSeeAll={() => navigate(PATHS.rewards)}
        />

        {/* AI 추천 */}
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

        {/* 환경 기여 현황 */}
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

        {/* 최근 활동 */}
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
