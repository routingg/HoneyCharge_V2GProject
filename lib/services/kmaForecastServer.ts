import { getRenewableForecastBreakdown } from "@/lib/services/renewableForecastService";
import type {
  CloudForecastPoint,
  ShortTermForecastFrame,
  ShortTermForecastResult,
} from "@/lib/services/shortTermForecastService";
import type { Region, WeatherHour } from "@/lib/types";

interface KmaForecastItem {
  category?: string;
  fcstDate?: string;
  fcstTime?: string;
  fcstValue?: string | number;
}

interface KmaForecastPayload {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaForecastItem[];
      };
    };
  };
}

interface ForecastCoordinate {
  latitude: number;
  longitude: number;
  nx: number;
  ny: number;
}

interface KmaPointSample extends CloudForecastPoint {
  timestamp: string;
  temperature: number;
  solarRadiation: number;
}

const KMA_ENDPOINT =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const KMA_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
const CACHE_TTL_MS = 10 * 60 * 1_000;

const REGION_SAMPLE_GRID: Record<
  Region,
  { latitudes: number[]; longitudes: number[] }
> = {
  jeju: {
    latitudes: [33.18, 33.48, 33.72],
    longitudes: [126.16, 126.52, 126.86],
  },
  honam: {
    latitudes: [34.5, 35.05, 35.55],
    longitudes: [126.3, 126.82, 127.3],
  },
};

const memoryCache = new Map<
  Region,
  { expiresAt: number; result: ShortTermForecastResult }
>();

function normalizedServiceKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed.includes("%")) return trimmed;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function formatDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function latestKmaBase(now = new Date()) {
  // Forecast files are normally available several minutes after each
  // production time. A 20-minute lag avoids requesting a file still being
  // published.
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1_000);
  kst.setUTCMinutes(kst.getUTCMinutes() - 20);
  const hour = kst.getUTCHours();
  const baseHour = [...KMA_BASE_HOURS]
    .reverse()
    .find((candidate) => candidate <= hour);

  if (baseHour !== undefined) {
    return {
      baseDate: formatDate(kst),
      baseTime: `${String(baseHour).padStart(2, "0")}00`,
    };
  }

  kst.setUTCDate(kst.getUTCDate() - 1);
  return {
    baseDate: formatDate(kst),
    baseTime: "2300",
  };
}

function toKmaGrid(latitude: number, longitude: number) {
  const earthRadiusKm = 6371.00877;
  const gridSpacingKm = 5;
  const standardLatitude1 = (30 * Math.PI) / 180;
  const standardLatitude2 = (60 * Math.PI) / 180;
  const originLongitude = (126 * Math.PI) / 180;
  const originLatitude = (38 * Math.PI) / 180;
  const originX = 43;
  const originY = 136;
  const radius = earthRadiusKm / gridSpacingKm;

  const cone =
    Math.log(
      Math.cos(standardLatitude1) /
        Math.cos(standardLatitude2),
    ) /
    Math.log(
      Math.tan(Math.PI * 0.25 + standardLatitude2 * 0.5) /
        Math.tan(
          Math.PI * 0.25 + standardLatitude1 * 0.5,
        ),
    );
  const scale =
    (Math.tan(
      Math.PI * 0.25 + standardLatitude1 * 0.5,
    ) **
      cone *
      Math.cos(standardLatitude1)) /
    cone;
  const originRadius =
    (radius * scale) /
    Math.tan(Math.PI * 0.25 + originLatitude * 0.5) **
      cone;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const pointRadius =
    (radius * scale) /
    Math.tan(Math.PI * 0.25 + latitudeRadians * 0.5) **
      cone;
  let theta = longitudeRadians - originLongitude;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= cone;

  return {
    nx: Math.floor(
      pointRadius * Math.sin(theta) + originX + 0.5,
    ),
    ny: Math.floor(
      originRadius -
        pointRadius * Math.cos(theta) +
        originY +
        0.5,
    ),
  };
}

function createRegionCoordinates(
  region: Region,
): ForecastCoordinate[] {
  const grid = REGION_SAMPLE_GRID[region];
  return grid.latitudes.flatMap((latitude) =>
    grid.longitudes.map((longitude) => ({
      latitude,
      longitude,
      ...toKmaGrid(latitude, longitude),
    })),
  );
}

function parseNumber(value: string | number | undefined) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePrecipitation(
  value: string | number | undefined,
) {
  const text = String(value ?? "");
  if (
    !text ||
    text.includes("강수없음") ||
    text.toLowerCase() === "no precipitation"
  ) {
    return 0;
  }
  const numbers =
    text.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!numbers.length) return 0;
  if (text.includes("미만")) return numbers[0] / 2;
  if (numbers.length > 1) {
    return (numbers[0] + numbers[1]) / 2;
  }
  return numbers[0];
}

function cloudCoverFromSky(value: string | number | undefined) {
  const skyCode = Math.round(parseNumber(value));
  if (skyCode === 1) return 10;
  if (skyCode === 3) return 55;
  if (skyCode === 4) return 90;
  return 50;
}

function timestampFromKma(date: string, time: string) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:00+09:00`;
}

function estimateSolarRadiation(
  timestamp: string,
  latitude: number,
  cloudCover: number,
) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 0;
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1_000);
  const startOfYear = Date.UTC(kst.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (Date.UTC(
      kst.getUTCFullYear(),
      kst.getUTCMonth(),
      kst.getUTCDate(),
    ) -
      startOfYear) /
      86_400_000,
  );
  const localHour =
    kst.getUTCHours() + kst.getUTCMinutes() / 60;
  const declination =
    23.45 *
    Math.sin(
      ((2 * Math.PI) / 365) * (284 + dayOfYear),
    );
  const latitudeRadians = (latitude * Math.PI) / 180;
  const declinationRadians =
    (declination * Math.PI) / 180;
  const hourAngle =
    ((15 * (localHour - 12)) * Math.PI) / 180;
  const sinAltitude =
    Math.sin(latitudeRadians) *
      Math.sin(declinationRadians) +
    Math.cos(latitudeRadians) *
      Math.cos(declinationRadians) *
      Math.cos(hourAngle);
  const clearSky = 1_000 * Math.max(0, sinAltitude) ** 1.15;
  const cloudFactor =
    1 - 0.75 * (Math.max(0, cloudCover) / 100) ** 3.4;
  return Math.round(Math.max(0, clearSky * cloudFactor));
}

async function fetchLocationForecast(
  coordinate: ForecastCoordinate,
  serviceKey: string,
  signal?: AbortSignal,
): Promise<KmaPointSample[]> {
  const { baseDate, baseTime } = latestKmaBase();
  const params = new URLSearchParams({
    serviceKey: normalizedServiceKey(serviceKey),
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(coordinate.nx),
    ny: String(coordinate.ny),
  });
  const response = await fetch(`${KMA_ENDPOINT}?${params}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`KMA request failed (${response.status}).`);
  }

  const payload = (await response.json()) as KmaForecastPayload;
  const header = payload.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(
      `KMA response error (${header?.resultCode ?? "unknown"}: ${header?.resultMsg ?? "no message"}).`,
    );
  }
  const items = payload.response?.body?.items?.item;
  if (!Array.isArray(items) || !items.length) {
    throw new Error("KMA forecast response is empty.");
  }

  const byTimestamp = new Map<
    string,
    Record<string, string | number | undefined>
  >();
  for (const item of items) {
    if (!item.fcstDate || !item.fcstTime || !item.category) {
      continue;
    }
    const timestamp = timestampFromKma(
      item.fcstDate,
      item.fcstTime,
    );
    const values = byTimestamp.get(timestamp) ?? {};
    values[item.category] = item.fcstValue;
    byTimestamp.set(timestamp, values);
  }

  const oldestUsefulTime = Date.now() - 60 * 60 * 1_000;
  return [...byTimestamp.entries()]
    .filter(
      ([timestamp]) =>
        new Date(timestamp).getTime() >= oldestUsefulTime,
    )
    .sort(
      ([first], [second]) =>
        new Date(first).getTime() -
        new Date(second).getTime(),
    )
    .slice(0, 24)
    .map(([timestamp, values]) => {
      const cloudCover = cloudCoverFromSky(values.SKY);
      const tenMeterWind = Math.max(
        0,
        parseNumber(values.WSD),
      );
      return {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        timestamp,
        cloudCover,
        precipitation: Number(
          parsePrecipitation(values.PCP).toFixed(1),
        ),
        // KMA WSD is a near-surface forecast. A conservative power-law
        // multiplier makes it comparable with the hub-height wind used by
        // the demonstration generation curve.
        windSpeed: Number((tenMeterWind * 1.35).toFixed(1)),
        windDirection:
          ((Math.round(parseNumber(values.VEC)) % 360) + 360) %
          360,
        temperature: Number(
          parseNumber(values.TMP).toFixed(1),
        ),
        solarRadiation: estimateSolarRadiation(
          timestamp,
          coordinate.latitude,
          cloudCover,
        ),
      };
    });
}

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) /
        values.length
    : 0;
}

function buildFrames(
  region: Region,
  locations: KmaPointSample[][],
): ShortTermForecastFrame[] {
  const timestamps = [
    ...new Set(
      locations.flatMap((samples) =>
        samples.map((sample) => sample.timestamp),
      ),
    ),
  ]
    .sort(
      (first, second) =>
        new Date(first).getTime() -
        new Date(second).getTime(),
    )
    .slice(0, 24);

  return timestamps.flatMap((timestamp) => {
    const samples = locations
      .map((location) =>
        location.find(
          (sample) => sample.timestamp === timestamp,
        ),
      )
      .filter(
        (sample): sample is KmaPointSample =>
          sample !== undefined,
      );
    if (!samples.length) return [];

    const representative: WeatherHour = {
      timestamp,
      region,
      temperature: Number(
        average(
          samples.map((sample) => sample.temperature),
        ).toFixed(1),
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
        average(
          samples.map((sample) => sample.windSpeed),
        ).toFixed(1),
      ),
      windDirection: Math.round(
        average(
          samples.map((sample) => sample.windDirection),
        ),
      ),
      pressure: 1013,
      condition: "기상청 단기예보",
    };
    const generation =
      getRenewableForecastBreakdown(representative);

    return [
      {
        timestamp,
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
        averagePrecipitation:
          representative.precipitation,
        solarGenerationKw: generation.solarGenerationKw,
        windGenerationKw: generation.windGenerationKw,
      },
    ];
  });
}

export async function getKmaShortTermForecast(
  region: Region,
  serviceKey: string,
  signal?: AbortSignal,
): Promise<ShortTermForecastResult> {
  const cached = memoryCache.get(region);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const locationForecasts = await Promise.all(
    createRegionCoordinates(region).map((coordinate) =>
      fetchLocationForecast(
        coordinate,
        serviceKey,
        signal,
      ),
    ),
  );
  const frames = buildFrames(region, locationForecasts);
  if (!frames.length) {
    throw new Error("KMA returned no usable forecast frames.");
  }

  const result: ShortTermForecastResult = {
    provider: "kma",
    region,
    frames,
    generatedAt: new Date().toISOString(),
  };
  memoryCache.set(region, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });
  return result;
}
