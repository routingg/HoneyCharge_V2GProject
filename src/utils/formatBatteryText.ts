/**
 * 사용자 화면에 노출되는 배터리 관련 문구를 한 곳에서 관리한다.
 * 내부 변수명(soc, targetSoc, minSoc)은 호환성을 위해 유지하되,
 * 화면 텍스트에는 영문 약어 "SOC"를 노출하지 않는 것이 원칙이다.
 * (배터리 분석처럼 전문 용어 설명이 필요한 화면에서만 최초 1회 병기)
 */
export const BATTERY_LABELS = {
  level: '배터리 잔량',
  current: '현재 배터리',
  target: '목표 충전량',
  minimum: '최소 보장 배터리',
  expected: '예상 배터리',
  departure: '출발 시 배터리',
} as const;

/** 배터리 분석 등에서 최초 1회만 사용하는 병기 표기 */
export const BATTERY_LEVEL_WITH_TERM = '배터리 잔량(SOC)';

export const V2G_EXPLAINER =
  'V2G는 전기차 배터리의 남는 전력을 전력망과 나누고 보상받는 기능이에요.';

export function formatBatteryPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/** "배터리 80%" 형태 */
export function formatBatteryLevel(percent: number): string {
  return `배터리 ${Math.round(percent)}%`;
}

/** "최소 50%는 항상 남겨둘게요" */
export function formatMinimumSentence(minPercent: number): string {
  return `최소 ${Math.round(minPercent)}%는 항상 남겨둘게요`;
}

/** "출발할 때 배터리 약 78%" */
export function formatDepartureSentence(percent: number): string {
  return `출발할 때 배터리 약 ${Math.round(percent)}%`;
}

/** 24시간 "HH:mm" 문자열을 "오후 6시" / "오후 4:20" 형태로 바꾼다. */
export function formatKoreanClock(time: string): string {
  const [rawH, rawM] = time.split(':');
  const hour = Number(rawH);
  const minute = Number(rawM ?? 0);
  if (!Number.isFinite(hour)) return time;
  return formatKoreanHourMinute(hour, Number.isFinite(minute) ? minute : 0);
}

/** Date 객체를 "오후 6시" / "오후 4:20" 형태로 바꾼다. */
export function formatKoreanTime(date: Date): string {
  return formatKoreanHourMinute(date.getHours(), date.getMinutes());
}

function formatKoreanHourMinute(hour24: number, minute: number): string {
  const meridiem = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === 0 ? `${meridiem} ${hour12}시` : `${meridiem} ${hour12}:${String(minute).padStart(2, '0')}`;
}
