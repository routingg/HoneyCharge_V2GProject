import type { PartnerStore, PartnerStoreCategory } from '@/types';

/**
 * 리워드의 "체감 가치"와 "충전 시간 적합도"를 계산한다.
 *
 * ⚠️ 여기서 나오는 원화 값은 모두 **예상 가치**이며 현금 환급률이 아니다.
 * 화면 문구에는 항상 "약", "상당", "예상 가치" 표현을 사용한다.
 */

export type TimeFit = 'perfect' | 'comfortable' | 'short' | 'not-recommended';

export interface RewardRecommendation {
  valuePerPoint: number;
  affordability: boolean;
  timeFit: TimeFit;
  distanceScore: number;
  valueScore: number;
  totalScore: number;
  recommendationReason: string;
  /** 왕복 도보 + 예상 체류 시간(분) */
  roundTripMinutes: number;
  /** 교환 후 남는 포인트 (부족하면 음수) */
  pointsAfterExchange: number;
  outOfStock: boolean;
}

export const TIME_FIT_LABEL: Record<TimeFit, string> = {
  perfect: '시간 딱 맞음',
  comfortable: '여유 있게 이용 가능',
  short: '짧게 이용 가능',
  'not-recommended': '충전 후 이용 추천',
};

export const PARTNER_CATEGORY_LABEL: Record<PartnerStoreCategory, string> = {
  cafe: '카페',
  restaurant: '식당',
  convenience: '편의점',
  shopping: '쇼핑',
  tourism: '관광 체험',
  carwash: '차량 관리',
};

export interface RewardValueInput {
  store: PartnerStore;
  pointsBalance: number;
  /** 충전 완료까지 남은 시간(분). 진행 중인 충전이 없으면 null */
  remainingChargingMinutes: number | null;
  remainingQuantity?: number;
  /** 사용자 선호 카테고리(mock) */
  preferredCategories?: PartnerStoreCategory[];
}

/** 사용자 선호 카테고리 mock — 실제로는 이용 이력에서 학습할 값 */
export const MOCK_PREFERRED_CATEGORIES: PartnerStoreCategory[] = ['cafe', 'restaurant'];

export function evaluateReward(input: RewardValueInput): RewardRecommendation {
  const { store, pointsBalance, remainingChargingMinutes } = input;
  const remainingQuantity = input.remainingQuantity ?? 1;
  const preferred = input.preferredCategories ?? MOCK_PREFERRED_CATEGORIES;

  const requiredPoints = Math.max(1, store.requiredPoints);
  const valuePerPoint = Math.round((store.estimatedValueWon / requiredPoints) * 100) / 100;
  const affordability = pointsBalance >= store.requiredPoints;
  const pointsAfterExchange = pointsBalance - store.requiredPoints;
  const outOfStock = remainingQuantity <= 0;

  const roundTripMinutes = store.walkingMinutes * 2 + store.averageStayMinutes;
  const timeFit = resolveTimeFit(remainingChargingMinutes, roundTripMinutes, store.walkingMinutes);

  // 1P당 2원을 만점으로 본다
  const valueScore = clamp01(valuePerPoint / 2) * 100;
  // 1.5km를 0점 기준으로 본다
  const distanceScore = clamp01(1 - store.distanceMeters / 1500) * 100;
  const timeScore = TIME_SCORE[timeFit];
  const affordabilityScore = affordability ? 100 : 30;
  const preferenceBonus = preferred.includes(store.category) ? 8 : 0;

  let totalScore =
    valueScore * 0.35 + timeScore * 0.25 + distanceScore * 0.2 + affordabilityScore * 0.2 + preferenceBonus;
  if (outOfStock) totalScore *= 0.3;

  return {
    valuePerPoint,
    affordability,
    timeFit,
    distanceScore: Math.round(distanceScore),
    valueScore: Math.round(valueScore),
    totalScore: Math.round(Math.min(100, totalScore)),
    recommendationReason: buildReason({ timeFit, valuePerPoint, affordability, outOfStock, store }),
    roundTripMinutes,
    pointsAfterExchange,
    outOfStock,
  };
}

const TIME_SCORE: Record<TimeFit, number> = {
  perfect: 100,
  comfortable: 85,
  short: 55,
  'not-recommended': 20,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function resolveTimeFit(
  remainingMinutes: number | null,
  roundTripMinutes: number,
  walkingMinutes: number
): TimeFit {
  // 진행 중인 충전이 없으면 매장이 권장하는 충전 시간을 기준으로 본다
  if (remainingMinutes === null) return 'comfortable';
  if (remainingMinutes >= roundTripMinutes + 20) return 'comfortable';
  if (remainingMinutes >= roundTripMinutes - 5) return 'perfect';
  if (remainingMinutes >= walkingMinutes * 2 + 10) return 'short';
  return 'not-recommended';
}

function buildReason(args: {
  timeFit: TimeFit;
  valuePerPoint: number;
  affordability: boolean;
  outOfStock: boolean;
  store: PartnerStore;
}): string {
  if (args.outOfStock) return '재고가 모두 소진돼 지금은 교환할 수 없어요';
  if (!args.affordability) return '포인트를 조금 더 모으면 교환할 수 있어요';
  if (args.timeFit === 'perfect') return '충전 시간에 딱 맞게 다녀올 수 있어요';
  if (args.timeFit === 'comfortable') return `도보 ${args.store.walkingMinutes}분 거리라 여유 있게 이용할 수 있어요`;
  if (args.timeFit === 'short') return '짧게 들렀다 오기 좋아요';
  return '충전이 끝난 뒤에 이용하는 걸 추천해요';
}

/** 충전 잔여 시간과 적합도를 문장으로 표현한다. */
export function formatTimeFitMessage(
  timeFit: TimeFit,
  remainingChargingMinutes: number | null,
  roundTripMinutes: number
): string {
  if (remainingChargingMinutes === null) {
    return `왕복·이용에 약 ${roundTripMinutes}분이 필요해요`;
  }
  const prefix = `충전 완료까지 ${remainingChargingMinutes}분 남아`;
  switch (timeFit) {
    case 'comfortable':
      return `${prefix} 여유 있게 이용할 수 있어요`;
    case 'perfect':
      return `${prefix} 시간에 딱 맞게 다녀올 수 있어요`;
    case 'short':
      return `${prefix} 짧게 들렀다 올 수 있어요`;
    default:
      return `${prefix} 지금 이용하기는 어려워요`;
  }
}

/** "1P당 약 1.5원 가치" */
export function formatValuePerPoint(valuePerPoint: number): string {
  return `1P당 약 ${valuePerPoint.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원 가치`;
}

/** "약 4,500원 상당" */
export function formatEstimatedValue(won: number): string {
  return `약 ${won.toLocaleString('ko-KR')}원 상당`;
}

/** 일반 교환 상품 평균(1P당 1원) 대비 가치가 높은지 */
export function isHighValue(valuePerPoint: number): boolean {
  return valuePerPoint >= 1.3;
}
