import { DEMO_USER_VEHICLE_ID } from "@/lib/data/mockData";
import { calculateGridBalance } from "@/lib/services/gridBalanceService";
import type {
  HourlyEnergyData,
  SimulationResult,
  Vehicle,
  VehicleSchedule,
} from "@/lib/types";

export type VehicleEnergyState =
  | "charging"
  | "discharging"
  | "standby"
  | "soc-protected"
  | "disconnected";

const EV_EFFICIENCY_KWH_PER_100KM = 18.6;
/**
 * v2gScheduler의 방전 허용 기준(soc >= minimumSoc + 8)과 동일한 여유값을
 * 사용합니다. 이 범위 안에 있다는 것은 "방전이 배터리 보호 때문에
 * 멈춘 상태"라는 뜻과 정확히 일치합니다.
 */
const SOC_PROTECTION_MARGIN = 8;
const GRID_BALANCE_THRESHOLD_KW = 150;

export function getDemoUserSchedule(
  simulation: SimulationResult,
): VehicleSchedule {
  const schedule = simulation.schedules.find(
    (candidate) => candidate.vehicle.id === DEMO_USER_VEHICLE_ID,
  );
  if (!schedule) {
    throw new Error(
      `Demo user vehicle ${DEMO_USER_VEHICLE_ID} not found in simulation`,
    );
  }
  return schedule;
}

/**
 * 방전 중이 아닌데 최소 보장 SOC 근처(margin 이내)에 머물러 있으면
 * 배터리 보호를 위해 V2G가 의도적으로 멈춘 상태로 해석합니다.
 */
export function deriveEnergyState(
  schedule: VehicleSchedule,
  hour: number,
): VehicleEnergyState {
  const { vehicle } = schedule;
  if (!vehicle.isConnected) return "disconnected";

  const item = schedule.items[hour];
  const soc = item?.expectedSocAfter ?? vehicle.currentSoc;

  if (item?.action === "charge" && item.powerKw > 0) return "charging";
  if (item?.action === "discharge" && item.powerKw > 0) {
    return "discharging";
  }
  if (soc <= vehicle.minimumSoc + SOC_PROTECTION_MARGIN) {
    return "soc-protected";
  }
  return "standby";
}

export function estimateRangeKm(vehicle: Vehicle, soc: number): number {
  const usableKWh = (soc / 100) * vehicle.batteryCapacityKWh;
  return Math.round(
    (usableKWh / EV_EFFICIENCY_KWH_PER_100KM) * 100,
  );
}

export interface V2GWindow {
  startTime: string;
  energyKWh: number;
}

/** 오늘 하루 중 방전(V2G 전력 공유)이 발생하는 첫 구간과 총량입니다. */
export function getTodayV2GWindow(
  schedule: VehicleSchedule,
): V2GWindow | null {
  const dischargeItems = schedule.items.filter(
    (item) => item.action === "discharge" && item.powerKw > 0,
  );
  if (dischargeItems.length === 0) return null;

  const energyKWh = Number(
    dischargeItems
      .reduce((sum, item) => sum + item.powerKw, 0)
      .toFixed(1),
  );

  return {
    startTime: dischargeItems[0].timestamp.slice(11, 16),
    energyKWh,
  };
}

export function getRecommendedMinimumSoc(vehicle: Vehicle): number {
  return Math.max(20, vehicle.minimumSoc - 3);
}

export interface ScheduleBlock {
  action: "charge" | "discharge";
  startTime: string;
  endTime: string;
  energyKWh: number;
  avgPowerKw: number;
}

/**
 * 오늘 하루의 충전·방전 구간을 시작~끝 시각 블록으로 묶습니다. V2G
 * 일정 화면이 시간별 items 배열을 직접 순회하지 않도록 한 번만
 * 계산해서 공유합니다.
 */
export function getScheduleBlocks(
  schedule: VehicleSchedule,
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  let current: {
    action: "charge" | "discharge";
    startHour: number;
    endHour: number;
    powerKwSum: number;
    hours: number;
  } | null = null;

  const flush = () => {
    if (!current) return;
    blocks.push({
      action: current.action,
      startTime: schedule.items[current.startHour].timestamp.slice(11, 16),
      endTime:
        current.endHour + 1 < schedule.items.length
          ? schedule.items[current.endHour + 1].timestamp.slice(11, 16)
          : "24:00",
      energyKWh: Number(current.powerKwSum.toFixed(1)),
      avgPowerKw: Number(
        (current.powerKwSum / current.hours).toFixed(1),
      ),
    });
    current = null;
  };

  schedule.items.forEach((item, hour) => {
    const action = item.action;
    if (action !== "charge" && action !== "discharge") {
      flush();
      return;
    }
    if (current && current.action === action) {
      current.endHour = hour;
      current.powerKwSum += item.powerKw;
      current.hours += 1;
    } else {
      flush();
      current = {
        action,
        startHour: hour,
        endHour: hour,
        powerKwSum: item.powerKw,
        hours: 1,
      };
    }
  });
  flush();

  return blocks;
}

/**
 * 지금 충전 중이 아니면 null입니다. 충전 중이면, 지금 이후 처음으로
 * 충전이 멈추는 시각(완충 또는 잉여전력 종료)을 "HH:mm"으로 반환합니다.
 */
export function getChargeCompleteEta(
  schedule: VehicleSchedule,
  fromHour: number,
): string | null {
  if (schedule.items[fromHour]?.action !== "charge") return null;
  const stopItem = schedule.items
    .slice(fromHour + 1)
    .find((item) => item.action !== "charge");
  const target = stopItem ?? schedule.items[schedule.items.length - 1];
  return target.timestamp.slice(11, 16);
}

/**
 * 홈 화면 스킨(E-pit / myHyundai)이 공통으로 소비하는 뷰모델입니다.
 * 두 스킨 모두 이 객체만 읽고, 계산은 절대 다시 하지 않습니다.
 */
export interface HomeViewModel {
  vehicle: Vehicle;
  soc: number;
  rangeKm: number;
  energyState: VehicleEnergyState;
  powerKw: number;
  chargeEta: string | null;
  minimumSoc: number;
  recommendedMinimumSoc: number;
  v2gWindow: V2GWindow | null;
  rewardPoints: number;
  signalCopy: EnergySignalCopy;
  sessionEnergy: SessionEnergy | null;
}

export interface SessionEnergy {
  energyKWh: number;
  estimatedPoints: number;
}

/**
 * 지금 충전·방전 중이 아니면 null입니다. 충전/방전 중이면, 같은 동작이
 * 끊기지 않고 이어진 구간(오늘 이 세션)의 누적 에너지량을 더합니다.
 * 예상 포인트는 하루 전체 rewardPoints를 하루 충·방전 총량으로 나눈
 * 평균 kWh당 포인트를 적용한 근사치입니다 — settleSharedSavingsRewards는
 * 시간대별로 다른 단가를 쓰므로 세션 화면용 추정값이지 정산값이 아닙니다.
 */
export function getSessionEnergy(
  schedule: VehicleSchedule,
  hour: number,
): SessionEnergy | null {
  const action = schedule.items[hour]?.action;
  if (action !== "charge" && action !== "discharge") return null;

  let start = hour;
  while (start > 0 && schedule.items[start - 1]?.action === action) {
    start -= 1;
  }
  const energyKWh = Number(
    schedule.items
      .slice(start, hour + 1)
      .reduce((sum, item) => sum + item.powerKw, 0)
      .toFixed(1),
  );

  return {
    energyKWh,
    estimatedPoints: Math.round(energyKWh * getPointsPerKWh(schedule)),
  };
}

/** 하루 rewardPoints를 하루 충·방전 총량으로 나눈 평균 kWh당 포인트입니다. */
function getPointsPerKWh(schedule: VehicleSchedule): number {
  const dayTotalKWh = schedule.chargeEnergyKWh + schedule.dischargeEnergyKWh;
  return dayTotalKWh > 0 ? schedule.rewardPoints / dayTotalKWh : 0;
}

/** 스케줄 블록 하나가 하루 보상 중 차지하는 몫의 근사치입니다. */
export function estimateBlockPoints(
  schedule: VehicleSchedule,
  block: ScheduleBlock,
): number {
  return Math.round(block.energyKWh * getPointsPerKWh(schedule));
}

export interface WeeklyMetricPoint {
  label: string;
  participationKWh: number;
  rewardPoints: number;
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
/** 시연용 요일별 변동 배율입니다 — 무작위가 아니라 고정값이라 항상 같은 모양을 그립니다. */
const WEEKDAY_MULTIPLIERS = [0.55, 0.8, 0.45, 1, 0.9, 0.35, 0.65];

/**
 * 실제로는 하루치 시뮬레이션만 있어서, 오늘의 충·방전량과 보상에 고정
 * 요일별 배율을 곱해 만든 시연용 주간 참여 데이터입니다. 실제 누적
 * 실적이 아니라 "이런 패턴으로 보일 것"을 보여주기 위한 근사치입니다.
 */
export function getWeeklyParticipation(
  schedule: VehicleSchedule,
): WeeklyMetricPoint[] {
  const todayKWh = schedule.chargeEnergyKWh + schedule.dischargeEnergyKWh;
  return WEEKDAY_LABELS.map((label, index) => ({
    label,
    participationKWh: Number(
      (todayKWh * WEEKDAY_MULTIPLIERS[index]).toFixed(1),
    ),
    rewardPoints: Math.round(
      schedule.rewardPoints * WEEKDAY_MULTIPLIERS[index],
    ),
  }));
}

export type GridSignal = "surplus" | "balanced" | "peak";

export interface EnergySignalCopy {
  signal: GridSignal;
  headline: string;
  detail: string;
}

/**
 * 운영 대시보드와 동일한 calculateGridBalance() 결과를 소비자 언어로
 * 옮깁니다. 같은 데이터, 다른 표현이라는 원칙(스펙 §18)을 지키기 위해
 * 잔여 조정량을 다시 계산하지 않고 그대로 재사용합니다.
 */
export function getEnergySignalCopy(
  energy: HourlyEnergyData,
  v2gWindow: V2GWindow | null,
): EnergySignalCopy {
  const balance = calculateGridBalance({
    demandKw: energy.electricityDemandKw,
    fixedBaseSupplyKw: energy.fixedBaseSupplyKw,
    renewableSupplyKw: energy.renewableGenerationKw,
    v2gChargeKw: energy.v2gChargePowerKw,
    v2gDischargeKw: energy.v2gDischargePowerKw,
  });

  if (balance.residualBeforeV2gKw <= -GRID_BALANCE_THRESHOLD_KW) {
    return {
      signal: "surplus",
      headline: "재생에너지 여유",
      detail: "지금 충전하기 좋은 시간이에요.",
    };
  }
  if (balance.residualBeforeV2gKw >= GRID_BALANCE_THRESHOLD_KW) {
    return {
      signal: "peak",
      headline: "전력 사용 증가",
      detail: v2gWindow
        ? `${v2gWindow.startTime}부터 전력 공유 예정이에요.`
        : "지금 전력이 많이 필요한 시간이에요.",
    };
  }
  return {
    signal: "balanced",
    headline: "전력 수급 안정",
    detail: "지금은 평소와 비슷한 시간이에요.",
  };
}
