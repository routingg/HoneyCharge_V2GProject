import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import type {
  AbsorptionHorizon,
  DashboardStats,
  HourlyEnergyData,
  PeakSupplyInsight,
  SurplusAbsorptionInsight,
  VehicleSchedule,
} from "@/lib/types";

const HOUSEHOLD_DAILY_USE_KWH = 10;
const CURTAILMENT_AVOIDANCE_RATE = 0.86;
const PERIOD_DAYS = {
  day: 1,
  week: 7,
  month: 30,
} as const;

export function buildSurplusAbsorptionInsight(
  energy: HourlyEnergyData[],
): SurplusAbsorptionInsight {
  const dailyAbsorbedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gChargePowerKw,
    0,
  );
  const peak = energy.reduce<HourlyEnergyData | undefined>(
    (currentPeak, item) =>
      !currentPeak ||
      item.v2gChargePowerKw >
        currentPeak.v2gChargePowerKw
        ? item
        : currentPeak,
    undefined,
  );
  const periods = (
    Object.entries(PERIOD_DAYS) as [
      AbsorptionHorizon,
      1 | 7 | 30,
    ][]
  ).reduce<SurplusAbsorptionInsight["periods"]>(
    (result, [horizon, days]) => {
      const absorbedEnergyKWh = Math.round(
        dailyAbsorbedEnergyKWh * days,
      );
      result[horizon] = {
        horizon,
        days,
        absorbedEnergyKWh,
        curtailmentReductionKWh: Math.round(
          absorbedEnergyKWh *
            CURTAILMENT_AVOIDANCE_RATE,
        ),
        householdDayEquivalents: Math.round(
          absorbedEnergyKWh /
            HOUSEHOLD_DAILY_USE_KWH,
        ),
        basis:
          horizon === "day"
            ? "daily-forecast"
            : "scaled-projection",
      };
      return result;
    },
    {} as SurplusAbsorptionInsight["periods"],
  );

  return {
    periods,
    peakAbsorptionPowerKw: peak?.v2gChargePowerKw ?? 0,
    peakAbsorptionHour:
      peak?.timestamp.slice(11, 16) ?? "--:--",
    activeAbsorptionHours: energy.filter(
      (item) => item.v2gChargePowerKw > 0,
    ).length,
    assumptions: {
      householdDailyUseKWh: 10,
      curtailmentAvoidanceRate: 0.86,
    },
  };
}

export function buildPeakSupplyInsight(
  energy: HourlyEnergyData[],
): PeakSupplyInsight {
  const dailySuppliedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gDischargePowerKw,
    0,
  );
  const activeSupplyHours = energy.filter(
    (item) => item.v2gDischargePowerKw > 0,
  ).length;
  const peak = energy.reduce<HourlyEnergyData | undefined>(
    (currentPeak, item) =>
      !currentPeak ||
      item.v2gDischargePowerKw >
        currentPeak.v2gDischargePowerKw
        ? item
        : currentPeak,
    undefined,
  );
  const demandPeak = energy.reduce<HourlyEnergyData | undefined>(
    (currentPeak, item) =>
      !currentPeak ||
      item.electricityDemandKw >
        currentPeak.electricityDemandKw
        ? item
        : currentPeak,
    undefined,
  );
  const periods = (
    Object.entries(PERIOD_DAYS) as [
      AbsorptionHorizon,
      1 | 7 | 30,
    ][]
  ).reduce<PeakSupplyInsight["periods"]>(
    (result, [horizon, days]) => {
      const suppliedEnergyKWh = Math.round(
        dailySuppliedEnergyKWh * days,
      );
      result[horizon] = {
        horizon,
        days,
        suppliedEnergyKWh,
        householdDayEquivalents: Math.round(
          suppliedEnergyKWh /
            HOUSEHOLD_DAILY_USE_KWH,
        ),
        basis:
          horizon === "day"
            ? "daily-forecast"
            : "scaled-projection",
      };
      return result;
    },
    {} as PeakSupplyInsight["periods"],
  );
  const peakDemandKw =
    demandPeak?.electricityDemandKw ?? 0;
  const supplyAtPeakDemandKw =
    demandPeak?.v2gDischargePowerKw ?? 0;

  return {
    periods,
    peakSupplyPowerKw: peak?.v2gDischargePowerKw ?? 0,
    peakSupplyHour:
      peak?.timestamp.slice(11, 16) ?? "--:--",
    activeSupplyHours,
    averageActiveSupplyPowerKw:
      activeSupplyHours > 0
        ? Math.round(
            dailySuppliedEnergyKWh /
              activeSupplyHours,
          )
        : 0,
    peakDemandHour:
      demandPeak?.timestamp.slice(11, 16) ?? "--:--",
    supplyAtPeakDemandKw,
    peakDemandCoveragePercent:
      peakDemandKw > 0
        ? Number(
            (
              (supplyAtPeakDemandKw / peakDemandKw) *
              100
            ).toFixed(1),
          )
        : 0,
    assumptions: {
      householdDailyUseKWh: 10,
    },
  };
}

export function buildDashboardStats(
  energy: HourlyEnergyData[],
  schedules: VehicleSchedule[],
): DashboardStats {
  const renewableKWh = energy.reduce(
    (sum, item) => sum + item.renewableGenerationKw,
    0,
  );
  const demandKWh = energy.reduce(
    (sum, item) => sum + item.electricityDemandKw,
    0,
  );
  const absorbedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gChargePowerKw,
    0,
  );
  const suppliedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gDischargePowerKw,
    0,
  );
  const participatingSchedules = schedules.filter(
    ({ vehicle }) =>
      vehicle.isConnected && vehicle.isV2GEnabled,
  );
  const currentItems = participatingSchedules.map(
    (schedule) => schedule.items[DEMO_CURRENT_HOUR],
  );
  const currentEnergy = energy[DEMO_CURRENT_HOUR];
  const chargingVehicles =
    (currentEnergy?.v2gChargePowerKw ?? 0) > 0
      ? currentItems.filter(
          (item) => item?.action === "charge",
        ).length
      : 0;
  const dischargingVehicles =
    (currentEnergy?.v2gDischargePowerKw ?? 0) > 0
      ? currentItems.filter(
          (item) => item?.action === "discharge",
        ).length
      : 0;
  const peak = energy.reduce((max, item) =>
    item.electricityDemandKw > max.electricityDemandKw ? item : max,
  );
  const surplusAbsorption =
    buildSurplusAbsorptionInsight(energy);
  const peakSupply = buildPeakSupplyInsight(energy);

  return {
    renewableEnergyMWh: Number((renewableKWh / 1000).toFixed(1)),
    demandEnergyMWh: Number((demandKWh / 1000).toFixed(1)),
    participatingVehicles: participatingSchedules.length,
    chargingVehicles,
    dischargingVehicles,
    standbyVehicles:
      participatingSchedules.length -
      chargingVehicles -
      dischargingVehicles,
    absorbedEnergyKWh: Math.round(absorbedEnergyKWh),
    suppliedEnergyKWh: Math.round(suppliedEnergyKWh),
    curtailmentReductionKWh: Math.round(absorbedEnergyKWh * 0.86),
    peakHour: peak.timestamp.slice(11, 16),
    surplusAbsorption,
    peakSupply,
  };
}
