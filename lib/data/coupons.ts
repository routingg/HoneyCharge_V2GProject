export interface DemoCoupon {
  id: string;
  merchant: string;
  item: string;
  pointCost: number;
  used: boolean;
}

/** 실제 가맹점 연동이 아닌 시연용 쿠폰 3장입니다. */
export const DEMO_COUPONS: DemoCoupon[] = [
  {
    id: "jungmun-cafe",
    merchant: "중문 로컬카페",
    item: "아메리카노",
    pointCost: 2000,
    used: false,
  },
  {
    id: "seogwipo-bakery",
    merchant: "서귀포 베이커리",
    item: "크루아상",
    pointCost: 1500,
    used: false,
  },
  {
    id: "jeju-market",
    merchant: "제주 로컬마켓",
    item: "5,000원 할인",
    pointCost: 5000,
    used: true,
  },
];

/** 시연용 누적 HoneyPoint 기준값입니다. 오늘 적립분은 별도로 더해집니다. */
export const DEMO_WALLET_BASE_POINTS = 6140;
