import { buildDashboardStats } from "@/lib/services/dashboardService";
import { forecastElectricityDemand } from "@/lib/services/demandForecastService";
import { getFixedBaseSupplyKw } from "@/lib/services/gridBalanceService";
import { forecastRenewableGeneration } from "@/lib/services/renewableForecastService";
import { settleSharedSavingsRewards } from "@/lib/services/rewardSettlementService";
import { scheduleVehicle } from "@/lib/services/v2gScheduler";
import { getVehicles } from "@/lib/services/vehicleService";
import { getHourlyWeather } from "@/lib/services/weatherService";
import type {
  HourlyEnergyData,
  Region,
  SimulationResult,
  WeatherHour,
} from "@/lib/types";

export function buildEnergyTimeline(
  region: Region,
  currentWeather?: WeatherHour,
): HourlyEnergyData[] {
  return getHourlyWeather(region).map((weather, hour) => {
    const currentHour = currentWeather
      ? Number(currentWeather.timestamp.slice(11, 13))
      : -1;
    const normalizedWeather =
      currentWeather && hour === currentHour
        ? {
            ...currentWeather,
            region,
            timestamp: weather.timestamp,
          }
        : weather;
    const renewable =
      forecastRenewableGeneration(normalizedWeather);
    const electricityDemandKw = forecastElectricityDemand(
      region,
      hour,
    );
    const fixedBaseSupplyKw = getFixedBaseSupplyKw(region);
    return {
      ...normalizedWeather,
      ...renewable,
      fixedBaseSupplyKw,
      electricityDemandKw,
      surplusPowerKw:
        fixedBaseSupplyKw +
        renewable.renewableGenerationKw -
        electricityDemandKw,
      v2gChargePowerKw: 0,
      v2gDischargePowerKw: 0,
    };
  });
}

export function runSimulation(
  region: Region,
  currentWeather?: WeatherHour,
): SimulationResult {
  const baseEnergy = buildEnergyTimeline(region, currentWeather);
  const rawSchedules = getVehicles().map((vehicle) =>
    scheduleVehicle(vehicle, baseEnergy),
  );
  const baselineSchedules = getVehicles().map((vehicle) =>
    scheduleVehicle(
      { ...vehicle, isV2GEnabled: false },
      baseEnergy,
    ),
  );

  const energy = baseEnergy.map((hour, hourIndex) => {
    const charge = rawSchedules.reduce((sum, schedule) => {
      const actual = schedule.items[hourIndex];
      const baseline = baselineSchedules.find(
        (candidate) =>
          candidate.vehicle.id === schedule.vehicle.id,
      )?.items[hourIndex];
      return sum +
        (schedule.vehicle.isV2GEnabled &&
        actual.action === "charge"
          ? Math.max(
              0,
              actual.powerKw -
                (baseline?.action === "charge"
                  ? baseline.powerKw
                  : 0),
            )
          : 0);
    }, 0);
    const discharge = rawSchedules.reduce((sum, schedule) => {
      const item = schedule.items[hourIndex];
      return (
        sum +
        (schedule.vehicle.isV2GEnabled &&
        item.action === "discharge"
          ? item.powerKw
          : 0)
      );
    }, 0);

    return {
      ...hour,
      v2gChargePowerKw: Math.round(
        Math.min(Math.max(0, hour.surplusPowerKw), charge),
      ),
      v2gDischargePowerKw: Math.round(
        Math.min(Math.max(0, -hour.surplusPowerKw), discharge),
      ),
    };
  });
  const rewardSettlement = settleSharedSavingsRewards(
    baseEnergy,
    rawSchedules,
    baselineSchedules,
  );
  const schedules = rewardSettlement.schedules;

  return {
    region,
    energy,
    schedules,
    stats: buildDashboardStats(energy, schedules),
    rewardSettlement: rewardSettlement.summary,
  };
}
