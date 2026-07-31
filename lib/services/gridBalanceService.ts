import type { Region } from "@/lib/types";

const FIXED_BASE_SUPPLY_KW = {
  jeju: 1_200,
  honam: 1_450,
} satisfies Record<Region, number>;

export interface GridBalanceInput {
  demandKw: number;
  fixedBaseSupplyKw: number;
  renewableSupplyKw: number;
  v2gChargeKw?: number;
  v2gDischargeKw?: number;
}

/**
 * 시연에서는 화석·계약전원 기저공급을 권역별 고정값으로 두고,
 * 재생에너지와 V2G가 남은 수급 차이를 조정합니다.
 * 잔여 조정량이 양수면 추가 공급이 필요하고 음수면 잉여입니다.
 */
export function calculateGridBalance({
  demandKw,
  fixedBaseSupplyKw,
  renewableSupplyKw,
  v2gChargeKw = 0,
  v2gDischargeKw = 0,
}: GridBalanceInput) {
  const residualBeforeV2gKw =
    demandKw - fixedBaseSupplyKw - renewableSupplyKw;
  const netV2gSupplyKw = v2gDischargeKw - v2gChargeKw;
  const residualAfterV2gKw =
    residualBeforeV2gKw - netV2gSupplyKw;

  return {
    residualBeforeV2gKw,
    netV2gSupplyKw,
    residualAfterV2gKw,
  };
}

export function getFixedBaseSupplyKw(region: Region): number {
  return FIXED_BASE_SUPPLY_KW[region];
}
