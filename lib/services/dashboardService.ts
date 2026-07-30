import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import type {
  AbsorptionHorizon,
  DashboardStats,
  HourlyEnergyData,
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
  const currentItems = schedules.map(
    (schedule) => schedule.items[DEMO_CURRENT_HOUR],
  );
  const peak = energy.reduce((max, item) =>
    item.electricityDemandKw > max.electricityDemandKw ? item : max,
  );
  const surplusAbsorption =
    buildSurplusAbsorptionInsight(energy);

  return {
    renewableEnergyMWh: Number((renewableKWh / 1000).toFixed(1)),
    demandEnergyMWh: Number((demandKWh / 1000).toFixed(1)),
    participatingVehicles: schedules.filter(
      ({ vehicle }) =>
        vehicle.isConnected && vehicle.isV2GEnabled,
    ).length,
    chargingVehicles: currentItems.filter(
      (item) => item.action === "charge",
    ).length,
    dischargingVehicles: currentItems.filter(
      (item) => item.action === "discharge",
    ).length,
    standbyVehicles: currentItems.filter(
      (item) => item.action === "standby",
    ).length,
    absorbedEnergyKWh: Math.round(absorbedEnergyKWh),
    suppliedEnergyKWh: Math.round(suppliedEnergyKWh),
    curtailmentReductionKWh: Math.round(absorbedEnergyKWh * 0.86),
    peakHour: peak.timestamp.slice(11, 16),
    surplusAbsorption,
  };
}
