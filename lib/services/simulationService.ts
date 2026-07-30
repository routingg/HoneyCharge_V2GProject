import { buildDashboardStats } from "@/lib/services/dashboardService";
import { forecastElectricityDemand } from "@/lib/services/demandForecastService";
import { forecastRenewableGeneration } from "@/lib/services/renewableForecastService";
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
    return {
      ...normalizedWeather,
      ...renewable,
      electricityDemandKw,
      surplusPowerKw:
        renewable.renewableGenerationKw - electricityDemandKw,
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
  const schedules = getVehicles().map((vehicle) =>
    scheduleVehicle(vehicle, baseEnergy),
  );

  const energy = baseEnergy.map((hour, hourIndex) => {
    const charge = schedules.reduce((sum, schedule) => {
      const item = schedule.items[hourIndex];
      return sum + (item.action === "charge" ? item.powerKw : 0);
    }, 0);
    const discharge = schedules.reduce((sum, schedule) => {
      const item = schedule.items[hourIndex];
      return sum + (item.action === "discharge" ? item.powerKw : 0);
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

  return {
    region,
    energy,
    schedules,
    stats: buildDashboardStats(energy, schedules),
  };
}
