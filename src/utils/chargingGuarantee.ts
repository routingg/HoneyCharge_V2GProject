import { formatBatteryLevel, formatKoreanTime, formatMinimumSentence } from './formatBatteryText';

/**
 * 프로토타입용 충전 보장 계산.
 *
 * 실제 충전 곡선(테이퍼링), 배터리 온도, 계통 요금제는 모델링하지 않는다.
 * 대신 입력값이 바뀌면 예상 완료 시간과 보장 상태가 **일관되게** 바뀌는 것을 목표로 한다.
 */

export type GuaranteeStatus = 'guaranteed' | 'charging' | 'reached' | 'attention' | 'not-set';

export type ChargingPhaseInput = 'idle' | 'charging' | 'v2g' | 'paused' | 'completed';

export interface ChargingGuaranteeInput {
  currentBatteryPercent: number;
  targetBatteryPercent: number;
  minimumBatteryPercent: number;
  /** 24시간 "HH:mm" */
  departureTime: string;
  chargingPowerKw: number;
  batteryCapacityKwh: number;
  v2gEnabled: boolean;
  estimatedDischargeKwh?: number;
  phase?: ChargingPhaseInput;
  /** 출발 시간·목표 충전량이 아직 설정되지 않은 상태 */
  hasSettings?: boolean;
  /** 테스트/시뮬레이션용 기준 시각 */
  now?: Date;
}

export interface ChargingGuaranteeResult {
  estimatedCompletionTime: Date | null;
  estimatedCompletionLabel: string;
  departureTimeLabel: string;
  recommendedStartLabel: string;
  estimatedDepartureBattery: number;
  isGuaranteePossible: boolean;
  guaranteeStatus: GuaranteeStatus;
  statusLabel: string;
  displayMessage: string;
  subMessages: string[];
  warningMessage: string | null;
  minutesUntilDeparture: number;
  requiredKwh: number;
  requiredMinutes: number;
}

export const GUARANTEE_STATUS_LABEL: Record<GuaranteeStatus, string> = {
  guaranteed: '보장 가능',
  charging: '충전 중',
  reached: '목표 달성',
  attention: '확인 필요',
  'not-set': '설정 필요',
};

/** "HH:mm"을 기준 시각 이후의 가장 가까운 시점으로 해석한다(지나갔으면 내일). */
export function resolveDepartureDate(departureTime: string, now: Date): Date {
  const [rawH, rawM] = departureTime.split(':');
  const hour = Number(rawH);
  const minute = Number(rawM ?? 0);
  const departure = new Date(now);
  if (Number.isFinite(hour)) {
    departure.setHours(hour, Number.isFinite(minute) ? minute : 0, 0, 0);
  }
  if (departure.getTime() <= now.getTime()) {
    departure.setDate(departure.getDate() + 1);
  }
  return departure;
}

export function calculateChargingGuarantee(input: ChargingGuaranteeInput): ChargingGuaranteeResult {
  const now = input.now ?? new Date();
  const {
    currentBatteryPercent,
    targetBatteryPercent,
    minimumBatteryPercent,
    departureTime,
    batteryCapacityKwh,
    v2gEnabled,
    phase = 'idle',
    hasSettings = true,
  } = input;

  const power = Math.max(1, input.chargingPowerKw);
  const capacity = Math.max(1, batteryCapacityKwh);

  const departure = resolveDepartureDate(departureTime, now);
  const departureTimeLabel = formatKoreanTime(departure);
  const minutesUntilDeparture = Math.max(0, Math.round((departure.getTime() - now.getTime()) / 60000));

  // 필요 충전량 → 예상 충전 시간
  const deltaPercent = Math.max(0, targetBatteryPercent - currentBatteryPercent);
  const requiredKwh = Math.round(((capacity * deltaPercent) / 100) * 10) / 10;
  const requiredMinutes = Math.ceil((requiredKwh / power) * 60);

  const completion = new Date(now.getTime() + requiredMinutes * 60000);
  const estimatedCompletionTime = deltaPercent <= 0 ? now : completion;
  const estimatedCompletionLabel = formatKoreanTime(estimatedCompletionTime);

  // 출발까지 남은 시간 안에 실제로 올릴 수 있는 배터리
  const achievablePercent = Math.min(
    targetBatteryPercent,
    currentBatteryPercent + ((minutesUntilDeparture / 60) * power * 100) / capacity
  );
  const isGuaranteePossible = achievablePercent >= targetBatteryPercent - 0.5;

  // 충전 시작 권장 시각(늦게 시작해도 목표를 맞출 수 있는 마지노선)
  const recommendedStart = new Date(departure.getTime() - requiredMinutes * 60000);
  const recommendedStartLabel = formatKoreanTime(
    recommendedStart.getTime() < now.getTime() ? now : recommendedStart
  );

  // V2G 방전량 반영 (최소 보장 배터리 아래로는 내려가지 않는다)
  const dischargeKwh = v2gEnabled ? Math.max(0, input.estimatedDischargeKwh ?? 0) : 0;
  const dischargePercent = (dischargeKwh / capacity) * 100;
  const baseDeparture = isGuaranteePossible ? targetBatteryPercent : achievablePercent;
  const estimatedDepartureBattery = Math.round(
    Math.max(minimumBatteryPercent, baseDeparture - dischargePercent)
  );

  const guaranteeStatus = resolveStatus({
    hasSettings,
    phase,
    isGuaranteePossible,
    currentBatteryPercent,
    targetBatteryPercent,
  });

  const { displayMessage, warningMessage } = buildMessages({
    guaranteeStatus,
    phase,
    isGuaranteePossible,
    departureTimeLabel,
    recommendedStartLabel,
    targetBatteryPercent,
    minimumBatteryPercent,
  });

  const subMessages = buildSubMessages({
    currentBatteryPercent,
    phase,
    estimatedCompletionLabel,
    minimumBatteryPercent,
    guaranteeStatus,
  });

  return {
    estimatedCompletionTime: deltaPercent <= 0 ? null : completion,
    estimatedCompletionLabel: deltaPercent <= 0 ? '충전 완료' : estimatedCompletionLabel,
    departureTimeLabel,
    recommendedStartLabel,
    estimatedDepartureBattery,
    isGuaranteePossible,
    guaranteeStatus,
    statusLabel: GUARANTEE_STATUS_LABEL[guaranteeStatus],
    displayMessage,
    subMessages,
    warningMessage,
    minutesUntilDeparture,
    requiredKwh,
    requiredMinutes,
  };
}

function resolveStatus(args: {
  hasSettings: boolean;
  phase: ChargingPhaseInput;
  isGuaranteePossible: boolean;
  currentBatteryPercent: number;
  targetBatteryPercent: number;
}): GuaranteeStatus {
  if (!args.hasSettings) return 'not-set';
  if (args.currentBatteryPercent >= args.targetBatteryPercent) return 'reached';
  if (!args.isGuaranteePossible) return 'attention';
  if (args.phase === 'paused') return 'attention';
  if (args.phase === 'charging' || args.phase === 'v2g') return 'charging';
  return 'guaranteed';
}

function buildMessages(args: {
  guaranteeStatus: GuaranteeStatus;
  phase: ChargingPhaseInput;
  isGuaranteePossible: boolean;
  departureTimeLabel: string;
  recommendedStartLabel: string;
  targetBatteryPercent: number;
  minimumBatteryPercent: number;
}): { displayMessage: string; warningMessage: string | null } {
  const target = Math.round(args.targetBatteryPercent);
  const minimum = Math.round(args.minimumBatteryPercent);

  if (args.guaranteeStatus === 'not-set') {
    return { displayMessage: '출발 시간과 목표 충전량을 설정해 주세요', warningMessage: null };
  }

  if (args.phase === 'v2g') {
    return {
      displayMessage: `전력을 나누는 중이에요. 배터리 ${minimum}% 이상을 지켜드려요`,
      warningMessage: null,
    };
  }

  if (args.phase === 'paused') {
    return {
      displayMessage: '충전 상태를 확인해 주세요',
      warningMessage: `충전이 멈춰 있어요. 다시 시작해야 ${args.departureTimeLabel}까지 ${target}%를 맞출 수 있어요.`,
    };
  }

  if (args.guaranteeStatus === 'reached') {
    return {
      displayMessage: `출발에 필요한 배터리 ${target}%가 준비됐어요`,
      warningMessage: null,
    };
  }

  if (!args.isGuaranteePossible) {
    return {
      displayMessage: `${args.departureTimeLabel}까지 배터리 ${target}%를 맞추기 어려워요`,
      warningMessage: `현재 설정으로는 ${args.departureTimeLabel}까지 ${target}% 충전이 어려워요`,
    };
  }

  if (args.phase === 'charging') {
    return {
      displayMessage: `${args.departureTimeLabel}까지 배터리 ${target}%를 보장해요`,
      warningMessage: null,
    };
  }

  return {
    displayMessage: `${args.recommendedStartLabel}부터 충전을 시작해 ${args.departureTimeLabel}까지 ${target}%를 채워드려요`,
    warningMessage: null,
  };
}

function buildSubMessages(args: {
  currentBatteryPercent: number;
  phase: ChargingPhaseInput;
  estimatedCompletionLabel: string;
  minimumBatteryPercent: number;
  guaranteeStatus: GuaranteeStatus;
}): string[] {
  const phaseText =
    args.phase === 'charging'
      ? '충전 중'
      : args.phase === 'v2g'
        ? '전력 나눔 중'
        : args.phase === 'paused'
          ? '일시정지'
          : args.phase === 'completed'
            ? '충전 완료'
            : '대기 중';

  const messages = [`${formatBatteryLevel(args.currentBatteryPercent)} · ${phaseText}`];
  if (args.guaranteeStatus !== 'reached') {
    messages.push(`예상 완료 ${args.estimatedCompletionLabel}`);
  }
  messages.push(formatMinimumSentence(args.minimumBatteryPercent));
  return messages;
}

/**
 * V2G 참여 시 예상 방전량(kWh). 최대 방전 출력과 출발까지 남은 여유 시간으로 산출한다.
 * 여유가 없으면 방전하지 않는다.
 */
export function estimateV2gDischargeKwh(args: {
  maxDischargeKw: number;
  minutesUntilDeparture: number;
  requiredChargingMinutes: number;
}): number {
  const spareMinutes = Math.max(0, args.minutesUntilDeparture - args.requiredChargingMinutes);
  const dischargeHours = Math.min(1.5, spareMinutes / 60);
  return Math.round(Math.max(0, args.maxDischargeKw) * dischargeHours * 10) / 10;
}
