import type { Region, WeatherHour } from "@/lib/types";

const REGION_COORDINATES: Record<
  Region,
  { latitude: number; longitude: number }
> = {
  jeju: { latitude: 33.50972, longitude: 126.52194 },
  honam: { latitude: 35.15472, longitude: 126.91556 },
};

interface OpenMeteoCurrentResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    precipitation?: number;
    weather_code?: number;
    is_day?: number;
    cloud_cover?: number;
    shortwave_radiation?: number;
    shortwave_radiation_instant?: number;
    wind_speed_10m?: number;
    wind_speed_80m?: number;
    wind_speed_120m?: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
  };
}

function weatherCondition(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1) return "대체로 맑음";
  if (code === 2) return "구름 조금";
  if (code === 3) return "흐림";
  if (code === 45 || code === 48) return "안개";
  if (code >= 51 && code <= 57) return "이슬비";
  if (code >= 61 && code <= 67) return "비";
  if (code >= 71 && code <= 77) return "눈";
  if (code >= 80 && code <= 82) return "소나기";
  if (code >= 85 && code <= 86) return "눈 소나기";
  if (code >= 95) return "뇌우";
  return "기상 관측";
}

function requiredNumber(
  value: number | undefined,
  field: string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Open-Meteo 응답에 ${field} 값이 없습니다.`);
  }
  return value;
}

/**
 * Open-Meteo의 현재 예보를 GridFlow 내부 기상 모델로 정규화합니다.
 * 공개 API 장애 시 호출부에서 기존 합성 예보로 즉시 대체합니다.
 */
export async function getLiveWeather(
  region: Region,
  signal?: AbortSignal,
): Promise<WeatherHour> {
  const coordinates = REGION_COORDINATES[region];
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: [
      "temperature_2m",
      "precipitation",
      "weather_code",
      "is_day",
      "cloud_cover",
      "shortwave_radiation_instant",
      "shortwave_radiation",
      "wind_speed_10m",
      "wind_speed_80m",
      "wind_speed_120m",
      "wind_direction_10m",
      "surface_pressure",
    ].join(","),
    wind_speed_unit: "ms",
    timezone: "Asia/Seoul",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Open-Meteo 요청 실패 (${response.status})`);
  }

  const payload =
    (await response.json()) as OpenMeteoCurrentResponse;
  const current = payload.current;
  if (!current?.time) {
    throw new Error("Open-Meteo 현재 시각이 없습니다.");
  }

  const windSpeed =
    current.wind_speed_120m ??
    current.wind_speed_80m ??
    current.wind_speed_10m;
  const solarRadiation =
    current.shortwave_radiation_instant ??
    current.shortwave_radiation;
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/.test(current.time)
    ? current.time
    : `${current.time}:00+09:00`;

  return {
    timestamp,
    region,
    temperature: Number(
      requiredNumber(
        current.temperature_2m,
        "temperature_2m",
      ).toFixed(1),
    ),
    precipitation: Number(
      requiredNumber(
        current.precipitation,
        "precipitation",
      ).toFixed(1),
    ),
    cloudCover: Math.round(
      requiredNumber(current.cloud_cover, "cloud_cover"),
    ),
    solarRadiation: Math.max(
      0,
      Math.round(
        requiredNumber(
          solarRadiation,
          "shortwave_radiation_instant",
        ),
      ),
    ),
    windSpeed: Number(
      requiredNumber(windSpeed, "wind_speed_120m").toFixed(1),
    ),
    windDirection: Math.round(
      requiredNumber(
        current.wind_direction_10m,
        "wind_direction_10m",
      ),
    ),
    pressure: Number(
      requiredNumber(
        current.surface_pressure,
        "surface_pressure",
      ).toFixed(1),
    ),
    condition: weatherCondition(
      requiredNumber(current.weather_code, "weather_code"),
    ),
  };
}
