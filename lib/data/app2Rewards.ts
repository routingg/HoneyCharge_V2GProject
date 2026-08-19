/**
 * /app2-only reward content (kept separate from lib/data/coupons.ts, which
 * /mobile's WalletBody still renders in "P"/HoneyPoint form). Numeric
 * values stay plain reward-point numbers; formatHoney() is what renders
 * them as 꿀 in the UI.
 */
export interface HoneyRewardEvent {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export interface HoneyExchangeItem {
  id: string;
  merchant: string;
  item: string;
  cost: number;
  kind: "coupon" | "charging-discount";
  used: boolean;
}

export const APP2_REWARD_BALANCE_BASE = 4500;

/** 시연용 리워드 내역입니다. 실제 정산 이력이 아닙니다. */
export const APP2_REWARD_HISTORY: HoneyRewardEvent[] = [
  { id: "v2g-1", label: "V2G 참여 보상", amount: 1200, date: "8월 18일" },
  { id: "charge-1", label: "제주 ICC 충전소 충전 완료 보상", amount: 350, date: "8월 17일" },
  { id: "v2g-2", label: "V2G 참여 보상", amount: 480, date: "8월 15일" },
  { id: "exchange-1", label: "중문 로컬카페 교환권 사용", amount: -2000, date: "8월 12일" },
];

/** 시연용 교환 상품입니다. 실제 가맹점/결제 연동이 아닙니다. */
export const APP2_EXCHANGE_ITEMS: HoneyExchangeItem[] = [
  {
    id: "starbucks-americano",
    merchant: "스타벅스",
    item: "DT 아메리카노 교환권",
    cost: 4500,
    kind: "coupon",
    used: false,
  },
  {
    id: "jeju-charge-discount",
    merchant: "제주 충전소",
    item: "충전 요금 10,000원 감면",
    cost: 10000,
    kind: "charging-discount",
    used: false,
  },
  {
    id: "jungmun-cafe",
    merchant: "중문 로컬카페",
    item: "아메리카노 교환권",
    cost: 2000,
    kind: "coupon",
    used: true,
  },
];
