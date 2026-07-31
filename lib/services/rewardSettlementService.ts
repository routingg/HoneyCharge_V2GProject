import type {
  HourlyEnergyData,
  Region,
  RewardSettlementSummary,
  VehicleRewardSettlement,
  VehicleSchedule,
} from "@/lib/types";

const SETTLEMENT_ASSUMPTIONS = {
  intervalHours: 1,
  hvdcExportLimitKw: {
    jeju: 300,
    honam: 420,
  },
  curtailmentValueWonPerKWh: 120,
  avoidedSupplyCostWonPerKWh: 190,
  benefitShareRate: 0.2,
  pointWonValue: 1,
} as const;

const emptyVehicleSettlement = (): VehicleRewardSettlement => ({
  eligibleChargeKWh: 0,
  eligibleDischargeKWh: 0,
  avoidedCurtailmentKWh: 0,
  avoidedSupplyKWh: 0,
  grossGridBenefitWon: 0,
  sharedRewardPoolWon: 0,
  rewardWon: 0,
  shareRate: 0,
});

const round = (value: number, digits = 1) =>
  Number(value.toFixed(digits));

function actionPower(
  schedule: VehicleSchedule | undefined,
  hourIndex: number,
  action: "charge" | "discharge",
) {
  const item = schedule?.items[hourIndex];
  return item?.action === action ? item.powerKw : 0;
}

/**
 * 기준수요에는 평상시 EV 충전이 포함되므로, V2G 미운영 스케줄과 비교해
 * 실제로 추가된 충전량과 방전량만 공유절감 정산 대상으로 인정합니다.
 */
export function settleSharedSavingsRewards(
  energy: HourlyEnergyData[],
  actualSchedules: VehicleSchedule[],
  baselineSchedules: VehicleSchedule[],
): {
  schedules: VehicleSchedule[];
  summary: RewardSettlementSummary;
} {
  const region: Region = energy[0]?.region ?? "jeju";
  const intervalHours = SETTLEMENT_ASSUMPTIONS.intervalHours;
  const hvdcExportLimitKw =
    SETTLEMENT_ASSUMPTIONS.hvdcExportLimitKw[region];
  const baselineByVehicle = new Map(
    baselineSchedules.map((schedule) => [
      schedule.vehicle.id,
      schedule,
    ]),
  );
  const vehicleSettlements = new Map(
    actualSchedules.map((schedule) => [
      schedule.vehicle.id,
      emptyVehicleSettlement(),
    ]),
  );

  let baselineCurtailmentKWh = 0;
  let actualCurtailmentKWh = 0;
  let baselineAdditionalSupplyKWh = 0;
  let actualAdditionalSupplyKWh = 0;
  let avoidedCurtailmentKWh = 0;
  let avoidedAdditionalSupplyKWh = 0;
  let grossGridBenefitWon = 0;
  let sharedRewardPoolWon = 0;

  energy.forEach((hour, hourIndex) => {
    const contributions = actualSchedules.map((schedule) => {
      const baseline = baselineByVehicle.get(schedule.vehicle.id);
      const actualChargeKw = actionPower(
        schedule,
        hourIndex,
        "charge",
      );
      const baselineChargeKw = actionPower(
        baseline,
        hourIndex,
        "charge",
      );
      return {
        vehicleId: schedule.vehicle.id,
        eligibleChargeKWh:
          schedule.vehicle.isV2GEnabled
            ? Math.max(0, actualChargeKw - baselineChargeKw) *
              intervalHours
            : 0,
        eligibleDischargeKWh:
          schedule.vehicle.isV2GEnabled
            ? actionPower(schedule, hourIndex, "discharge") *
              intervalHours
            : 0,
      };
    });
    const totalChargeKWh = contributions.reduce(
      (sum, item) => sum + item.eligibleChargeKWh,
      0,
    );
    const totalDischargeKWh = contributions.reduce(
      (sum, item) => sum + item.eligibleDischargeKWh,
      0,
    );

    const renewableKWh =
      hour.renewableGenerationKw * intervalHours;
    const fixedSupplyKWh =
      hour.fixedBaseSupplyKw * intervalHours;
    const demandKWh = hour.electricityDemandKw * intervalHours;
    const hvdcExportLimitKWh =
      hvdcExportLimitKw * intervalHours;

    const curtailmentWithoutV2g = Math.min(
      renewableKWh,
      Math.max(
        renewableKWh +
          fixedSupplyKWh -
          demandKWh -
          hvdcExportLimitKWh,
        0,
      ),
    );
    const curtailmentWithV2g = Math.min(
      renewableKWh,
      Math.max(
        renewableKWh +
          fixedSupplyKWh -
          demandKWh -
          totalChargeKWh +
          totalDischargeKWh -
          hvdcExportLimitKWh,
        0,
      ),
    );
    const avoidedCurtailment = Math.max(
      curtailmentWithoutV2g - curtailmentWithV2g,
      0,
    );

    const supplyWithoutV2g = Math.max(
      demandKWh - renewableKWh - fixedSupplyKWh,
      0,
    );
    const supplyWithV2g = Math.max(
      demandKWh +
        totalChargeKWh -
        renewableKWh -
        fixedSupplyKWh -
        totalDischargeKWh,
      0,
    );
    const avoidedSupply = Math.max(
      supplyWithoutV2g - supplyWithV2g,
      0,
    );

    const chargeBenefitWon =
      avoidedCurtailment *
      SETTLEMENT_ASSUMPTIONS.curtailmentValueWonPerKWh;
    const dischargeBenefitWon =
      avoidedSupply *
      SETTLEMENT_ASSUMPTIONS.avoidedSupplyCostWonPerKWh;
    const chargePoolWon =
      chargeBenefitWon *
      SETTLEMENT_ASSUMPTIONS.benefitShareRate;
    const dischargePoolWon =
      dischargeBenefitWon *
      SETTLEMENT_ASSUMPTIONS.benefitShareRate;

    contributions.forEach((contribution) => {
      const settlement = vehicleSettlements.get(
        contribution.vehicleId,
      );
      if (!settlement) return;
      const chargeShare =
        totalChargeKWh > 0
          ? contribution.eligibleChargeKWh / totalChargeKWh
          : 0;
      const dischargeShare =
        totalDischargeKWh > 0
          ? contribution.eligibleDischargeKWh /
            totalDischargeKWh
          : 0;
      settlement.eligibleChargeKWh +=
        contribution.eligibleChargeKWh;
      settlement.eligibleDischargeKWh +=
        contribution.eligibleDischargeKWh;
      settlement.avoidedCurtailmentKWh +=
        avoidedCurtailment * chargeShare;
      settlement.avoidedSupplyKWh +=
        avoidedSupply * dischargeShare;
      settlement.grossGridBenefitWon +=
        chargeBenefitWon * chargeShare +
        dischargeBenefitWon * dischargeShare;
      settlement.sharedRewardPoolWon +=
        chargePoolWon * chargeShare +
        dischargePoolWon * dischargeShare;
      settlement.rewardWon +=
        chargePoolWon * chargeShare +
        dischargePoolWon * dischargeShare;
    });

    baselineCurtailmentKWh += curtailmentWithoutV2g;
    actualCurtailmentKWh += curtailmentWithV2g;
    baselineAdditionalSupplyKWh += supplyWithoutV2g;
    actualAdditionalSupplyKWh += supplyWithV2g;
    avoidedCurtailmentKWh += avoidedCurtailment;
    avoidedAdditionalSupplyKWh += avoidedSupply;
    grossGridBenefitWon += chargeBenefitWon + dischargeBenefitWon;
    sharedRewardPoolWon += chargePoolWon + dischargePoolWon;
  });

  const schedules = actualSchedules.map((schedule) => {
    const raw = vehicleSettlements.get(schedule.vehicle.id) ??
      emptyVehicleSettlement();
    const totalEligibleKWh =
      raw.eligibleChargeKWh + raw.eligibleDischargeKWh;
    const totalFleetEligibleKWh = Array.from(
      vehicleSettlements.values(),
    ).reduce(
      (sum, item) =>
        sum + item.eligibleChargeKWh + item.eligibleDischargeKWh,
      0,
    );
    const settlement: VehicleRewardSettlement = {
      eligibleChargeKWh: round(raw.eligibleChargeKWh),
      eligibleDischargeKWh: round(raw.eligibleDischargeKWh),
      avoidedCurtailmentKWh: round(raw.avoidedCurtailmentKWh),
      avoidedSupplyKWh: round(raw.avoidedSupplyKWh),
      grossGridBenefitWon: Math.round(raw.grossGridBenefitWon),
      sharedRewardPoolWon: Math.round(raw.sharedRewardPoolWon),
      rewardWon: Math.round(raw.rewardWon),
      shareRate:
        totalFleetEligibleKWh > 0
          ? round(
              (totalEligibleKWh / totalFleetEligibleKWh) * 100,
              1,
            )
          : 0,
    };
    return {
      ...schedule,
      rewardPoints: schedule.vehicle.isV2GEnabled
        ? Math.round(
            settlement.rewardWon /
              SETTLEMENT_ASSUMPTIONS.pointWonValue,
          )
        : 0,
      rewardSettlement: settlement,
    };
  });

  return {
    schedules,
    summary: {
      baselineCurtailmentKWh: round(baselineCurtailmentKWh),
      actualCurtailmentKWh: round(actualCurtailmentKWh),
      avoidedCurtailmentKWh: round(avoidedCurtailmentKWh),
      baselineAdditionalSupplyKWh: round(
        baselineAdditionalSupplyKWh,
      ),
      actualAdditionalSupplyKWh: round(
        actualAdditionalSupplyKWh,
      ),
      avoidedAdditionalSupplyKWh: round(
        avoidedAdditionalSupplyKWh,
      ),
      grossGridBenefitWon: Math.round(grossGridBenefitWon),
      sharedRewardPoolWon: Math.round(sharedRewardPoolWon),
      assumptions: {
        intervalHours,
        hvdcExportLimitKw,
        curtailmentValueWonPerKWh:
          SETTLEMENT_ASSUMPTIONS.curtailmentValueWonPerKWh,
        avoidedSupplyCostWonPerKWh:
          SETTLEMENT_ASSUMPTIONS.avoidedSupplyCostWonPerKWh,
        benefitShareRate:
          SETTLEMENT_ASSUMPTIONS.benefitShareRate,
        pointWonValue:
          SETTLEMENT_ASSUMPTIONS.pointWonValue,
      },
    },
  };
}

export function settleSingleVehicleReward(
  energy: HourlyEnergyData[],
  actualSchedule: VehicleSchedule,
  baselineSchedule: VehicleSchedule,
) {
  return settleSharedSavingsRewards(
    energy,
    [actualSchedule],
    [baselineSchedule],
  ).schedules[0];
}
