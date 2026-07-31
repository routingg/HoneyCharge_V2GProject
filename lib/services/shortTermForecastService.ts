import { getRenewableForecastBreakdown } from "@/lib/services/renewableForecastService";
import { getHourlyWeather } from "@/lib/services/weatherService";
import type { Region, WeatherHour } from "@/lib/types";

export type ShortTermForecastProvider =
  | "kma"
  | "open-meteo"
  | "demo-fallback";

export interface CloudForecastPoint {
  latitude: number;
  longitude: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
}

export interface ShortTermForecastFrame {
  timestamp: string;
  points: CloudForecastPoint[];
  averageCloudCover: number;
  averageWindSpeed: number;
  averagePrecipitation: number;
  solarGenerationKw: number;
  windGenerationKw: number;
}

export interface ShortTermForecastResult {
  provider: ShortTermForecastProvider;
  region: Region;
  frames: ShortTermForecastFrame[];
  generatedAt: string;
}

interface ForecastLocationResponse {
  latitude?: number;
  longitude?: number;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation?: number[];
    weather_code?: number[];
    cloud_cover?: number[];
    shortwave_radiation?: number[];
    wind_speed_10m?: number[];
    wind_speed_80m?: number[];
    wind_speed_120m?: number[];
    wind_direction_10m?: number[];
    surface_pressure?: number[];
  };
}

const REGION_GRID: Record<
  Region,
  { latitude: number[]; longitude: number[] }
> = {
  jeju: {
    latitude: [32.94, 33.16, 33.38, 33.6, 33.82, 34.04],
    longitude: [125.58, 125.96, 126.34, 126.72, 127.1, 127.48],
  },
  honam: {
    latitude: [
      33.65,
      34.05,
      34.45,
      34.85,
      35.25,
      35.65,
      36.05,
      36.45,
    ],
    longitude: [
      125.05,
      125.55,
      126.05,
      126.55,
      127.05,
      127.55,
      128.05,
      128.55,
    ],
  },
};

function weatherCondition(code: number): string {
  if (code === 0) return "맑음";
  if (code <= 2) return "대체로 맑음";
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

function finiteAt(
  values: number[] | undefined,
  index: number,
  fallback = 0,
) {
  const value = values?.[index];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function timestampWithSeoulOffset(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? value
    : `${value}:00+09:00`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function createGrid(region: Region) {
  const grid = REGION_GRID[region];
  return grid.latitude.flatMap((latitude) =>
    grid.longitude.map((longitude) => ({ latitude, longitude })),
  );
}

function responseList(
  payload: ForecastLocationResponse | ForecastLocationResponse[],
) {
  return Array.isArray(payload) ? payload : [payload];
}

function buildFrames(
  region: Region,
  responses: ForecastLocationResponse[],
) {
  const usable = responses.filter(
    (response) =>
      response.hourly?.time?.length &&
      typeof response.latitude === "number" &&
      typeof response.longitude === "number",
  );
  if (!usable.length) {
    throw new Error("Hourly grid forecast is empty.");
  }

  const frameCount = Math.min(
    24,
    ...usable.map((response) => response.hourly?.time?.length ?? 0),
  );
  if (frameCount < 1) {
    throw new Error("No forecast hours were returned.");
  }

  return Array.from({ length: frameCount }, (_, hourIndex) => {
    const samples = usable.map((response) => {
      const hourly = response.hourly!;
      const windSpeed =
        finiteAt(hourly.wind_speed_120m, hourIndex, Number.NaN) ||
        finiteAt(hourly.wind_speed_80m, hourIndex, Number.NaN) ||
        finiteAt(hourly.wind_speed_10m, hourIndex);

      return {
        latitude: response.latitude!,
        longitude: response.longitude!,
        cloudCover: Math.round(
          finiteAt(hourly.cloud_cover, hourIndex),
        ),
        precipitation: finiteAt(
          hourly.precipitation,
          hourIndex,
        ),
        windSpeed,
        windDirection: finiteAt(
          hourly.wind_direction_10m,
          hourIndex,
        ),
        temperature: finiteAt(
          hourly.temperature_2m,
          hourIndex,
        ),
        solarRadiation: Math.max(
          0,
          finiteAt(hourly.shortwave_radiation, hourIndex),
        ),
        pressure: finiteAt(
          hourly.surface_pressure,
          hourIndex,
          1013,
        ),
        weatherCode: finiteAt(
          hourly.weather_code,
          hourIndex,
        ),
        timestamp: timestampWithSeoulOffset(
          hourly.time?.[hourIndex] ?? "",
        ),
      };
    });

    const representative: WeatherHour = {
      timestamp: samples[0].timestamp,
      region,
      temperature: Number(
        average(samples.map((sample) => sample.temperature)).toFixed(
          1,
        ),
      ),
      precipitation: Number(
        average(
          samples.map((sample) => sample.precipitation),
        ).toFixed(1),
      ),
      cloudCover: Math.round(
        average(samples.map((sample) => sample.cloudCover)),
      ),
      solarRadiation: Math.round(
        average(
          samples.map((sample) => sample.solarRadiation),
        ),
      ),
      windSpeed: Number(
        average(samples.map((sample) => sample.windSpeed)).toFixed(
          1,
        ),
      ),
      windDirection: Math.round(
        average(
          samples.map((sample) => sample.windDirection),
        ),
      ),
      pressure: Number(
        average(samples.map((sample) => sample.pressure)).toFixed(1),
      ),
      condition: weatherCondition(
        Math.round(
          average(
            samples.map((sample) => sample.weatherCode),
          ),
        ),
      ),
    };
    const generation =
      getRenewableForecastBreakdown(representative);

    return {
      timestamp: representative.timestamp,
      points: samples.map(
        ({
          latitude,
          longitude,
          cloudCover,
          precipitation,
          windSpeed,
          windDirection,
        }) => ({
          latitude,
          longitude,
          cloudCover,
          precipitation,
          windSpeed,
          windDirection,
        }),
      ),
      averageCloudCover: representative.cloudCover,
      averageWindSpeed: representative.windSpeed,
      averagePrecipitation: representative.precipitation,
      solarGenerationKw: generation.solarGenerationKw,
      windGenerationKw: generation.windGenerationKw,
    } satisfies ShortTermForecastFrame;
  });
}

function buildFallbackFrames(
  region: Region,
): ShortTermForecastFrame[] {
  const grid = createGrid(region);
  return getHourlyWeather(region).map((weather, hourIndex) => {
    const generation = getRenewableForecastBreakdown(weather);
    const points = grid.map((coordinate) => {
      const westToEastBand = Math.sin(
        coordinate.longitude * 4.8 +
          coordinate.latitude * 1.9 -
          hourIndex * 0.31,
      );
      const broadCloudMass = Math.cos(
        coordinate.longitude * 1.7 -
          coordinate.latitude * 2.6 -
          hourIndex * 0.18,
      );
      const localCloudTexture = Math.sin(
        coordinate.longitude * 9.3 -
          coordinate.latitude * 6.1 -
          hourIndex * 0.42,
      );
      const variation =
        westToEastBand * 11 +
        broadCloudMass * 8 +
        localCloudTexture * 4;
      return {
        ...coordinate,
        cloudCover: Math.round(
          Math.min(
            100,
            Math.max(0, weather.cloudCover + variation),
          ),
        ),
        precipitation: weather.precipitation,
        windSpeed: Number(
          Math.max(
            0,
            weather.windSpeed +
              Math.cos(
                coordinate.longitude * 3.1 +
                  coordinate.latitude * 1.4 -
                  hourIndex * 0.26,
              ) * 0.8,
          ).toFixed(1),
        ),
        windDirection:
          (weather.windDirection +
            Math.sin(
              coordinate.longitude * 2.7 -
                coordinate.latitude * 1.8,
            ) *
              12 +
            360) %
          360,
      };
    });

    return {
      timestamp: weather.timestamp,
      points,
      averageCloudCover: weather.cloudCover,
      averageWindSpeed: weather.windSpeed,
      averagePrecipitation: weather.precipitation,
      solarGenerationKw: generation.solarGenerationKw,
      windGenerationKw: generation.windGenerationKw,
    };
  });
}

/**
 * The same-origin server adapter is tried first so KMA_SERVICE_KEY never
 * enters the browser bundle. Deployments without that secret fall back to
 * Open-Meteo's keyless multi-point grid.
 */
export async function getShortTermForecast(
  region: Region,
  signal?: AbortSignal,
): Promise<ShortTermForecastResult> {
  try {
    const kmaResponse = await fetch(
      `/api/kma-forecast?region=${region}`,
      {
        signal,
        headers: { accept: "application/json" },
      },
    );
    if (
      kmaResponse.status === 204 ||
      kmaResponse.status === 503
    ) {
      // The server adapter is intentionally unavailable when no secret is
      // configured. Continue with the public provider without logging an
      // operational error.
    } else if (kmaResponse.ok) {
      const kmaForecast =
        (await kmaResponse.json()) as ShortTermForecastResult;
      if (
        kmaForecast.provider === "kma" &&
        kmaForecast.region === region &&
        Array.isArray(kmaForecast.frames) &&
        kmaForecast.frames.length > 0
      ) {
        return kmaForecast;
      }
      console.warn(
        "[GridFlow KMA forecast] invalid server response",
      );
    } else {
      console.warn(
        `[GridFlow KMA forecast] server adapter unavailable (${kmaResponse.status})`,
      );
    }
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof DOMException &&
        error.name === "AbortError")
    ) {
      throw error;
    }
    console.warn("[GridFlow KMA forecast]", error);
  }

  const grid = createGrid(region);
  const params = new URLSearchParams({
    latitude: grid.map(({ latitude }) => latitude).join(","),
    longitude: grid.map(({ longitude }) => longitude).join(","),
    hourly: [
      "temperature_2m",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "shortwave_radiation",
      "wind_speed_10m",
      "wind_speed_80m",
      "wind_speed_120m",
      "wind_direction_10m",
      "surface_pressure",
    ].join(","),
    wind_speed_unit: "ms",
    timezone: "Asia/Seoul",
    forecast_hours: "24",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(
      `Open-Meteo forecast request failed (${response.status}).`,
    );
  }

  const payload = (await response.json()) as
    | ForecastLocationResponse
    | ForecastLocationResponse[];
  return {
    provider: "open-meteo",
    region,
    frames: buildFrames(region, responseList(payload)),
    generatedAt: new Date().toISOString(),
  };
}

export function getShortTermForecastFallback(
  region: Region,
): ShortTermForecastResult {
  return {
    provider: "demo-fallback",
    region,
    frames: buildFallbackFrames(region),
    generatedAt: new Date().toISOString(),
  };
}
