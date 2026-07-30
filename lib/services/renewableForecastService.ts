import type { Region, WeatherHour } from "@/lib/types";

export const REGION_CAPACITY = {
  jeju: { solarKw: 2_850, windKw: 1_720 },
  honam: { solarKw: 3_180, windKw: 1_260 },
} satisfies Record<Region, { solarKw: number; windKw: number }>;

export interface RenewableForecast {
  solarGenerationKw: number;
  windGenerationKw: number;
  renewableGenerationKw: number;
}

export interface RenewableForecastBreakdown
  extends RenewableForecast {
  solarCapacityKw: number;
  windCapacityKw: number;
  irradianceFactor: number;
  temperatureFactor: number;
  windFactor: number;
  pressureFactor: number;
  solarUtilizationPercent: number;
  windUtilizationPercent: number;
  sunAltitudeDegrees: number;
  sunDirection: string;
  windOperatingZone: string;
}

const REGION_COORDINATES: Record<
  Region,
  { latitude: number; longitude: number }
> = {
  jeju: { latitude: 33.50972, longitude: 126.52194 },
  honam: { latitude: 35.15472, longitude: 126.91556 },
};

function getSolarPosition(
  timestamp: string,
  region: Region,
): { altitude: number; direction: string } {
  const parts = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  );
  if (!parts) return { altitude: 0, direction: "계산 불가" };

  const [, yearText, monthText, dayText, hourText, minuteText] =
    parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText) + Number(minuteText) / 60;
  const dayOfYear = Math.floor(
    (Date.UTC(year, month - 1, day) -
      Date.UTC(year, 0, 0)) /
      86_400_000,
  );
  const fractionalYear =
    ((2 * Math.PI) / 365) *
    (dayOfYear - 1 + (hour - 12) / 24);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(fractionalYear) -
      0.032077 * Math.sin(fractionalYear) -
      0.014615 * Math.cos(2 * fractionalYear) -
      0.040849 * Math.sin(2 * fractionalYear));
  const declination =
    0.006918 -
    0.399912 * Math.cos(fractionalYear) +
    0.070257 * Math.sin(fractionalYear) -
    0.006758 * Math.cos(2 * fractionalYear) +
    0.000907 * Math.sin(2 * fractionalYear) -
    0.002697 * Math.cos(3 * fractionalYear) +
    0.00148 * Math.sin(3 * fractionalYear);
  const coordinates = REGION_COORDINATES[region];
  const solarMinutes =
    hour * 60 +
    equationOfTime +
    4 * coordinates.longitude -
    60 * 9;
  const hourAngle = ((solarMinutes / 4 - 180) * Math.PI) / 180;
  const latitude = (coordinates.latitude * Math.PI) / 180;
  const cosZenith = Math.min(
    1,
    Math.max(
      -1,
      Math.sin(latitude) * Math.sin(declination) +
        Math.cos(latitude) *
          Math.cos(declination) *
          Math.cos(hourAngle),
    ),
  );
  const altitude =
    90 - (Math.acos(cosZenith) * 180) / Math.PI;
  const azimuth =
    ((Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(latitude) -
        Math.tan(declination) * Math.cos(latitude),
    ) *
      180) /
      Math.PI +
      180 +
      360) %
    360;
  const directions = [
    "북",
    "북북동",
    "북동",
    "동북동",
    "동",
    "동남동",
    "남동",
    "남남동",
    "남",
    "남남서",
    "남서",
    "서남서",
    "서",
    "서북서",
    "북서",
    "북북서",
  ];

  return {
    altitude: Math.max(0, Math.round(altitude)),
    direction:
      altitude > 0
        ? directions[Math.round(azimuth / 22.5) % 16]
        : "지평선 아래",
  };
}

export function getRenewableForecastBreakdown(
  weather: WeatherHour,
): RenewableForecastBreakdown {
  const capacity = REGION_CAPACITY[weather.region];
  const irradianceFactor = Math.min(
    1,
    weather.solarRadiation / 900,
  );
  const temperatureFactor = Math.max(
    0.82,
    1 - Math.max(0, weather.temperature - 25) * 0.006,
  );
  const solarGenerationKw =
    capacity.solarKw *
    irradianceFactor *
    temperatureFactor;

  const wind = weather.windSpeed;
  let windFactor = 0;
  let windOperatingZone = "컷인 미만 · 발전 대기";
  if (wind >= 3 && wind < 12) {
    windFactor = Math.pow((wind - 3) / 9, 1.45);
    windOperatingZone = "증속 구간 · 출력 상승";
  } else if (wind >= 12 && wind < 25) {
    windFactor = 1;
    windOperatingZone = "정격 구간 · 출력 유지";
  } else if (wind >= 25) {
    windOperatingZone = "컷아웃 이상 · 안전 정지";
  }
  const pressureFactor = Math.min(
    1.04,
    Math.max(0.96, weather.pressure / 1013),
  );
  const windGenerationKw = Math.min(
    capacity.windKw,
    capacity.windKw * windFactor * pressureFactor,
  );

  const solarPosition = getSolarPosition(
    weather.timestamp,
    weather.region,
  );

  return {
    solarCapacityKw: capacity.solarKw,
    windCapacityKw: capacity.windKw,
    irradianceFactor,
    temperatureFactor,
    windFactor,
    pressureFactor,
    solarGenerationKw: Math.round(solarGenerationKw),
    windGenerationKw: Math.round(windGenerationKw),
    renewableGenerationKw: Math.round(
      solarGenerationKw + windGenerationKw,
    ),
    solarUtilizationPercent: Math.round(
      (solarGenerationKw / capacity.solarKw) * 100,
    ),
    windUtilizationPercent: Math.round(
      Math.min(1, windGenerationKw / capacity.windKw) * 100,
    ),
    sunAltitudeDegrees: solarPosition.altitude,
    sunDirection: solarPosition.direction,
    windOperatingZone,
  };
}

/** 태양 위치·운량이 반영된 일사량과 온도, 풍속 출력곡선을 이용한 시연용 추정식입니다. */
export function forecastRenewableGeneration(
  weather: WeatherHour,
): RenewableForecast {
  const breakdown = getRenewableForecastBreakdown(weather);

  return {
    solarGenerationKw: breakdown.solarGenerationKw,
    windGenerationKw: breakdown.windGenerationKw,
    renewableGenerationKw: breakdown.renewableGenerationKw,
  };
}
