"use client";

import {
  Cloud,
  CloudRain,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CanvasSource,
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";
import { textFor, useLanguage } from "@/lib/i18n";
import {
  getShortTermForecast,
  getShortTermForecastFallback,
  type ShortTermForecastFrame,
  type ShortTermForecastResult,
} from "@/lib/services/shortTermForecastService";
import type { Region } from "@/lib/types";

type ForecastConnection = "loading" | "live" | "fallback";
type ForecastMapStatus = "loading" | "ready" | "error";

const FORECAST_SOURCE_ID = "short-term-cloud-grid";
const FORECAST_CLOUD_SOURCE_ID = "short-term-cloud-field";
const CLOUD_FIELD_WIDTH = 360;
const CLOUD_FIELD_HEIGHT = 240;
const CLOUD_TRANSITION_MS = 920;
const MAP_VIEW: Record<
  Region,
  { center: [number, number]; zoom: number }
> = {
  jeju: { center: [126.52, 33.4], zoom: 8.55 },
  honam: { center: [126.83, 35.03], zoom: 7.5 },
};

interface CloudFieldBounds {
  west: number;
  east: number;
  north: number;
  south: number;
  smoothing: number;
  warp: number;
}

const CLOUD_FIELD_BOUNDS: Record<Region, CloudFieldBounds> = {
  jeju: {
    west: 125.5,
    east: 127.55,
    north: 34.08,
    south: 32.82,
    smoothing: 0.14,
    warp: 0.035,
  },
  honam: {
    west: 124.85,
    east: 128.8,
    north: 36.55,
    south: 33.55,
    smoothing: 0.23,
    warp: 0.065,
  },
};

const CLOUD_COLOR_STOPS = [
  { cover: 0, color: [198, 210, 218], alpha: 0 },
  { cover: 2, color: [164, 181, 192], alpha: 0.24 },
  { cover: 7, color: [126, 148, 163], alpha: 0.4 },
  { cover: 15, color: [91, 117, 136], alpha: 0.56 },
  { cover: 30, color: [59, 87, 109], alpha: 0.7 },
  { cover: 50, color: [40, 66, 88], alpha: 0.79 },
  { cover: 75, color: [25, 48, 70], alpha: 0.87 },
  { cover: 100, color: [13, 31, 49], alpha: 0.93 },
] as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function frameGeoJson(frame: ShortTermForecastFrame) {
  return {
    type: "FeatureCollection" as const,
    features: frame.points.map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        cloudCover: point.cloudCover,
        windSpeed: point.windSpeed,
        windDirection: point.windDirection,
        precipitation: point.precipitation,
      },
    })),
  };
}

function cloudCanvasCoordinates(
  region: Region,
): [[number, number], [number, number], [number, number], [number, number]] {
  const bounds = CLOUD_FIELD_BOUNDS[region];
  return [
    [bounds.west, bounds.north],
    [bounds.east, bounds.north],
    [bounds.east, bounds.south],
    [bounds.west, bounds.south],
  ];
}

function warpedCoordinate(
  longitude: number,
  latitude: number,
  region: Region,
) {
  const bounds = CLOUD_FIELD_BOUNDS[region];
  const centerLongitude = (bounds.west + bounds.east) / 2;
  const centerLatitude = (bounds.north + bounds.south) / 2;
  const x = longitude - centerLongitude;
  const y = latitude - centerLatitude;
  const firstWave = Math.sin(x * 5.1 + y * 3.7);
  const secondWave = Math.sin(x * 10.4 - y * 4.6 + 1.3);
  const thirdWave = Math.cos(y * 8.2 - x * 2.9 + 0.8);

  return {
    longitude:
      longitude +
      bounds.warp * (firstWave * 0.62 + secondWave * 0.38),
    latitude:
      latitude +
      bounds.warp *
        (thirdWave * 0.54 - secondWave * 0.24),
  };
}

function interpolatedCloudCover(
  frame: ShortTermForecastFrame,
  longitude: number,
  latitude: number,
  region: Region,
  applyShapeWarp = false,
) {
  if (!frame.points.length) return frame.averageCloudCover;
  const coordinate = applyShapeWarp
    ? warpedCoordinate(longitude, latitude, region)
    : { longitude, latitude };
  const bounds = CLOUD_FIELD_BOUNDS[region];
  const longitudeScale = Math.cos(
    ((bounds.north + bounds.south) / 2) *
      (Math.PI / 180),
  );
  const smoothingSquared = bounds.smoothing ** 2;
  let weightedCover = 0;
  let weightTotal = 0;

  for (const point of frame.points) {
    const x =
      (coordinate.longitude - point.longitude) * longitudeScale;
    const y = coordinate.latitude - point.latitude;
    const distanceSquared = x * x + y * y;
    const weight =
      1 /
      Math.pow(distanceSquared + smoothingSquared, 1.42);
    weightedCover += point.cloudCover * weight;
    weightTotal += weight;
  }

  return weightTotal > 0
    ? clamp(weightedCover / weightTotal, 0, 100)
    : frame.averageCloudCover;
}

function createCloudField(
  frame: ShortTermForecastFrame,
  region: Region,
) {
  const bounds = CLOUD_FIELD_BOUNDS[region];
  const values = new Float32Array(
    CLOUD_FIELD_WIDTH * CLOUD_FIELD_HEIGHT,
  );

  for (let y = 0; y < CLOUD_FIELD_HEIGHT; y += 1) {
    const latitude =
      bounds.north -
      (y / (CLOUD_FIELD_HEIGHT - 1)) *
        (bounds.north - bounds.south);
    for (let x = 0; x < CLOUD_FIELD_WIDTH; x += 1) {
      const longitude =
        bounds.west +
        (x / (CLOUD_FIELD_WIDTH - 1)) *
          (bounds.east - bounds.west);
      values[y * CLOUD_FIELD_WIDTH + x] =
        interpolatedCloudCover(
          frame,
          longitude,
          latitude,
          region,
          true,
        );
    }
  }

  return values;
}

function cloudColor(cloudCover: number) {
  const cover = clamp(cloudCover, 0, 100);
  let upperIndex = 1;
  while (
    upperIndex < CLOUD_COLOR_STOPS.length - 1 &&
    cover > CLOUD_COLOR_STOPS[upperIndex].cover
  ) {
    upperIndex += 1;
  }
  const lower = CLOUD_COLOR_STOPS[upperIndex - 1];
  const upper = CLOUD_COLOR_STOPS[upperIndex];
  const progress =
    (cover - lower.cover) /
    Math.max(1, upper.cover - lower.cover);

  return {
    red: Math.round(
      lower.color[0] +
        (upper.color[0] - lower.color[0]) * progress,
    ),
    green: Math.round(
      lower.color[1] +
        (upper.color[1] - lower.color[1]) * progress,
    ),
    blue: Math.round(
      lower.color[2] +
        (upper.color[2] - lower.color[2]) * progress,
    ),
    alpha:
      lower.alpha + (upper.alpha - lower.alpha) * progress,
  };
}

function paintCloudField(
  canvas: HTMLCanvasElement,
  fromValues: Float32Array,
  toValues: Float32Array,
  progress: number,
  displayedValues: Float32Array,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(
    CLOUD_FIELD_WIDTH,
    CLOUD_FIELD_HEIGHT,
  );
  const easedProgress =
    progress * progress * (3 - 2 * progress);

  for (let index = 0; index < toValues.length; index += 1) {
    const cover =
      fromValues[index] +
      (toValues[index] - fromValues[index]) * easedProgress;
    displayedValues[index] = cover;
    const { red, green, blue, alpha } = cloudColor(cover);
    const x = index % CLOUD_FIELD_WIDTH;
    const y = Math.floor(index / CLOUD_FIELD_WIDTH);
    const edgeDistance = Math.min(
      x / (CLOUD_FIELD_WIDTH - 1),
      1 - x / (CLOUD_FIELD_WIDTH - 1),
      y / (CLOUD_FIELD_HEIGHT - 1),
      1 - y / (CLOUD_FIELD_HEIGHT - 1),
    );
    const edgeFeather = clamp(edgeDistance / 0.055, 0, 1);
    const pixelIndex = index * 4;
    image.data[pixelIndex] = red;
    image.data[pixelIndex + 1] = green;
    image.data[pixelIndex + 2] = blue;
    image.data[pixelIndex + 3] = Math.round(
      alpha * edgeFeather * 255,
    );
  }

  context.putImageData(image, 0, 0);
}

function formatForecastTime(
  timestamp: string,
  language: "ko" | "en",
) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp.slice(11, 16);
  return new Intl.DateTimeFormat(
    language === "ko" ? "ko-KR" : "en-US",
    {
      timeZone: "Asia/Seoul",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: language === "en",
    },
  ).format(date);
}

function maximumFrame(
  frames: ShortTermForecastFrame[],
  selector: (frame: ShortTermForecastFrame) => number,
) {
  return frames.reduce(
    (best, frame) =>
      selector(frame) > selector(best) ? frame : best,
    frames[0],
  );
}

function cloudCoverBand(
  cloudCover: number,
  language: "ko" | "en",
) {
  if (cloudCover <= 10) {
    return textFor(language, "거의 맑음", "Mostly clear");
  }
  if (cloudCover <= 30) {
    return textFor(language, "옅은 구름", "Thin cloud cover");
  }
  if (cloudCover <= 60) {
    return textFor(language, "부분 흐림", "Broken cloud cover");
  }
  if (cloudCover <= 80) {
    return textFor(language, "높은 운량", "High cloud cover");
  }
  return textFor(language, "짙은 구름대", "Dense cloud cover");
}

export function CloudForecastMap({
  region,
}: {
  region: Region;
}) {
  const { language } = useLanguage();
  const t = useCallback(
    (korean: string, english: string) =>
      textFor(language, korean, english),
    [language],
  );
  const fallbackForecast = useMemo(
    () => getShortTermForecastFallback(region),
    [region],
  );
  const [forecast, setForecast] =
    useState<ShortTermForecastResult>(() =>
      getShortTermForecastFallback(region),
    );
  const [connection, setConnection] =
    useState<ForecastConnection>("loading");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mapStatus, setMapStatus] =
    useState<ForecastMapStatus>("loading");
  const [mapRevision, setMapRevision] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const activeFrameRef = useRef(forecast.frames[0]);
  const cloudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudAnimationRef = useRef<number | null>(null);
  const displayedCloudFieldRef = useRef<Float32Array | null>(
    null,
  );
  const cloudFieldCacheRef = useRef(
    new WeakMap<ShortTermForecastFrame, Float32Array>(),
  );
  const visibleForecast =
    forecast.region === region ? forecast : fallbackForecast;
  const visibleConnection =
    forecast.region === region ? connection : "loading";
  const frames = visibleForecast.frames;
  const activeFrame =
    frames[Math.min(selectedIndex, frames.length - 1)] ??
    frames[0];

  useEffect(() => {
    activeFrameRef.current = activeFrame;
  }, [activeFrame]);

  useEffect(() => {
    cloudFieldCacheRef.current =
      new WeakMap<ShortTermForecastFrame, Float32Array>();
  }, [visibleForecast]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      12_000,
    );

    getShortTermForecast(region, controller.signal)
      .then((result) => {
        if (!active) return;
        setForecast(result);
        setSelectedIndex(0);
        setConnection("live");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          console.warn("[HoneyCharge short-term forecast] timed out");
        } else {
          console.warn("[HoneyCharge short-term forecast]", error);
        }
        setForecast(fallbackForecast);
        setSelectedIndex(0);
        setConnection("fallback");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [fallbackForecast, region]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const stopAutomaticPlayback = () => {
      if (mediaQuery.matches) setIsPlaying(false);
    };
    stopAutomaticPlayback();
    mediaQuery.addEventListener(
      "change",
      stopAutomaticPlayback,
    );
    return () =>
      mediaQuery.removeEventListener(
        "change",
        stopAutomaticPlayback,
      );
  }, []);

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setSelectedIndex(
        (index) => (index + 1) % frames.length,
      );
    }, 1_350);
    return () => window.clearInterval(timer);
  }, [frames.length, isPlaying]);

  useEffect(() => {
    let disposed = false;
    let mapLoadTimer: number | undefined;

    async function createMap() {
      if (!containerRef.current) return;
      setMapStatus("loading");
      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;
        const view = MAP_VIEW[region];
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: view.center,
          zoom: view.zoom,
          minZoom: 6,
          maxZoom: 13,
          attributionControl: false,
          cooperativeGestures: true,
          locale: {
            "NavigationControl.ZoomIn": t("확대", "Zoom in"),
            "NavigationControl.ZoomOut": t("축소", "Zoom out"),
            "AttributionControl.ToggleAttribution": t(
              "지도 출처 보기",
              "Toggle attribution",
            ),
          },
        });
        mapRef.current = map;
        mapLoadTimer = window.setTimeout(() => {
          if (!disposed && !map.loaded()) {
            setMapStatus("error");
          }
        }, 10_000);
        map.on("error", (event) => {
          if (!map.isStyleLoaded()) {
            console.warn(
              "[HoneyCharge cloud map]",
              event.error?.message ?? "Map style failed to load.",
            );
            if (!disposed) setMapStatus("error");
          }
        });
        map.once("load", () => {
          if (mapLoadTimer) window.clearTimeout(mapLoadTimer);
          if (!disposed) setMapStatus("ready");
        });
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: false,
          }),
          "bottom-right",
        );
        map.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          "bottom-left",
        );

        map.once("style.load", () => {
          if (disposed) return;
          if (language === "en") {
            for (const layer of map.getStyle().layers ?? []) {
              if (
                layer.type !== "symbol" ||
                !JSON.stringify(
                  layer.layout?.["text-field"],
                ).includes("name:nonlatin")
              ) {
                continue;
              }
              try {
                map.setLayoutProperty(layer.id, "text-field", [
                  "coalesce",
                  ["get", "name_en"],
                  ["get", "name:latin"],
                  ["get", "name"],
                ]);
              } catch (error) {
                console.warn(
                  `[HoneyCharge forecast label: ${layer.id}]`,
                  error,
                );
              }
            }
          }
          map.addSource(FORECAST_SOURCE_ID, {
            type: "geojson",
            data: frameGeoJson(activeFrameRef.current),
          });
          const firstLabelLayer = map
            .getStyle()
            .layers?.find((layer) => layer.type === "symbol")
            ?.id;
          const cloudCanvas = document.createElement("canvas");
          cloudCanvas.width = CLOUD_FIELD_WIDTH;
          cloudCanvas.height = CLOUD_FIELD_HEIGHT;
          cloudCanvasRef.current = cloudCanvas;
          const initialCloudField = createCloudField(
            activeFrameRef.current,
            region,
          );
          const displayedCloudField = initialCloudField.slice();
          displayedCloudFieldRef.current = displayedCloudField;
          cloudFieldCacheRef.current.set(
            activeFrameRef.current,
            initialCloudField,
          );
          paintCloudField(
            cloudCanvas,
            initialCloudField,
            initialCloudField,
            1,
            displayedCloudField,
          );
          map.addSource(FORECAST_CLOUD_SOURCE_ID, {
            type: "canvas",
            canvas: cloudCanvas,
            coordinates: cloudCanvasCoordinates(region),
            animate: false,
          });
          map.addLayer(
            {
              id: "cloud-forecast-field",
              type: "raster",
              source: FORECAST_CLOUD_SOURCE_ID,
              paint: {
                "raster-opacity": 0.98,
                "raster-resampling": "linear",
                "raster-fade-duration": 0,
              },
            },
            firstLabelLayer,
          );
          map.addLayer(
            {
              id: "cloud-forecast-wind",
              type: "symbol",
              source: FORECAST_SOURCE_ID,
              minzoom: 8.3,
              layout: {
                "text-field": "➤",
                "text-size": 13,
                "text-rotate": [
                  "+",
                  ["get", "windDirection"],
                  90,
                ],
                "text-allow-overlap": true,
                "text-offset": [0, -0.75],
              },
              paint: {
                "text-color": "#1f7185",
                "text-halo-color": "rgba(255,255,255,.92)",
                "text-halo-width": 1.2,
              },
            },
            firstLabelLayer,
          );

          map.on("click", (event) => {
            const bounds = CLOUD_FIELD_BOUNDS[region];
            if (
              event.lngLat.lng < bounds.west ||
              event.lngLat.lng > bounds.east ||
              event.lngLat.lat < bounds.south ||
              event.lngLat.lat > bounds.north
            ) {
              return;
            }
            const frame = activeFrameRef.current;
            const popup = document.createElement("div");
            popup.className = "forecast-map-popup";
            const heading = document.createElement("strong");
            heading.textContent = formatForecastTime(
              frame.timestamp,
              language,
            );
            const details = document.createElement("span");
            const cloudCover = Math.round(
              interpolatedCloudCover(
                frame,
                event.lngLat.lng,
                event.lngLat.lat,
                region,
              ),
            );
            const nearestPoint = frame.points.length
              ? frame.points.reduce(
                  (nearest, point) => {
                    const nearestDistance =
                      (nearest.longitude - event.lngLat.lng) ** 2 +
                      (nearest.latitude - event.lngLat.lat) ** 2;
                    const pointDistance =
                      (point.longitude - event.lngLat.lng) ** 2 +
                      (point.latitude - event.lngLat.lat) ** 2;
                    return pointDistance < nearestDistance
                      ? point
                      : nearest;
                  },
                  frame.points[0],
                )
              : { windSpeed: frame.averageWindSpeed };
            details.textContent = t(
              `구름 ${cloudCover}% · ${cloudCoverBand(cloudCover, "ko")} · 인근 바람 ${nearestPoint.windSpeed.toFixed(1)}m/s`,
              `Cloud ${cloudCover}% · ${cloudCoverBand(cloudCover, "en")} · nearby wind ${nearestPoint.windSpeed.toFixed(1)}m/s`,
            );
            popup.appendChild(heading);
            popup.appendChild(details);
            new maplibregl.Popup({
              closeButton: true,
              maxWidth: "240px",
            })
              .setLngLat(event.lngLat)
              .setDOMContent(popup)
              .addTo(map);
          });
        });
      } catch (error) {
        console.warn("[HoneyCharge cloud map]", error);
        if (!disposed) setMapStatus("error");
      }
    }

    void createMap();
    return () => {
      disposed = true;
      if (mapLoadTimer) window.clearTimeout(mapLoadTimer);
      if (cloudAnimationRef.current !== null) {
        window.cancelAnimationFrame(cloudAnimationRef.current);
        cloudAnimationRef.current = null;
      }
      mapRef.current?.remove();
      mapRef.current = null;
      cloudCanvasRef.current = null;
      displayedCloudFieldRef.current = null;
    };
    // The map is intentionally recreated when locale or region changes.
  }, [language, mapRevision, region, t]);

  useEffect(() => {
    const source = mapRef.current?.getSource(
      FORECAST_SOURCE_ID,
    ) as GeoJSONSource | undefined;
    source?.setData(frameGeoJson(activeFrame));
  }, [activeFrame]);

  useEffect(() => {
    const map = mapRef.current;
    const canvas = cloudCanvasRef.current;
    const source = map?.getSource(
      FORECAST_CLOUD_SOURCE_ID,
    ) as CanvasSource | undefined;
    if (!map || !canvas || !source) return;

    let targetField =
      cloudFieldCacheRef.current.get(activeFrame);
    if (!targetField) {
      targetField = createCloudField(activeFrame, region);
      cloudFieldCacheRef.current.set(activeFrame, targetField);
    }
    const displayedField =
      displayedCloudFieldRef.current ?? targetField.slice();
    displayedCloudFieldRef.current = displayedField;
    const startField = displayedField.slice();
    const transitionStart = performance.now();

    if (cloudAnimationRef.current !== null) {
      window.cancelAnimationFrame(cloudAnimationRef.current);
    }
    source.play();

    const animateCloudField = (now: number) => {
      const progress = clamp(
        (now - transitionStart) / CLOUD_TRANSITION_MS,
        0,
        1,
      );
      paintCloudField(
        canvas,
        startField,
        targetField,
        progress,
        displayedField,
      );
      map.triggerRepaint();

      if (progress < 1) {
        cloudAnimationRef.current =
          window.requestAnimationFrame(animateCloudField);
        return;
      }
      source.pause();
      cloudAnimationRef.current = null;
    };

    cloudAnimationRef.current =
      window.requestAnimationFrame(animateCloudField);

    return () => {
      if (cloudAnimationRef.current !== null) {
        window.cancelAnimationFrame(cloudAnimationRef.current);
        cloudAnimationRef.current = null;
      }
    };
  }, [activeFrame, region]);

  const summary = useMemo(() => {
    const solarEnergyMWh =
      frames.reduce(
        (sum, frame) => sum + frame.solarGenerationKw,
        0,
      ) / 1_000;
    const windEnergyMWh =
      frames.reduce(
        (sum, frame) => sum + frame.windGenerationKw,
        0,
      ) / 1_000;
    const cloudiest = maximumFrame(
      frames,
      (frame) => frame.averageCloudCover,
    );
    const strongestWind = maximumFrame(
      frames,
      (frame) => frame.averageWindSpeed,
    );
    const solarPeak = maximumFrame(
      frames,
      (frame) => frame.solarGenerationKw,
    );
    const windPeak = maximumFrame(
      frames,
      (frame) => frame.windGenerationKw,
    );
    return {
      solarEnergyMWh,
      windEnergyMWh,
      cloudiest,
      strongestWind,
      solarPeak,
      windPeak,
    };
  }, [frames]);

  const connectionLabel =
    visibleConnection === "live" &&
    visibleForecast.provider === "kma"
      ? t(
          "기상청 단기예보 · 24시간",
          "KMA short-term forecast · 24 hours",
        )
      : visibleConnection === "live"
      ? t(
          "Open-Meteo 24시간 격자 예보",
          "Open-Meteo 24-hour grid forecast",
        )
      : visibleConnection === "loading"
        ? t("최신 예보 연결 중", "Connecting latest forecast")
        : t(
            "시연용 24시간 예보로 전환",
            "Demo 24-hour forecast fallback",
          );
  const cloudImpact =
    summary.cloudiest.averageCloudCover >= 70
      ? t(
          `${formatForecastTime(summary.cloudiest.timestamp, language)} 전후 짙은 구름으로 태양광 출력 저하가 예상됩니다.`,
          `Dense cloud near ${formatForecastTime(summary.cloudiest.timestamp, language)} is expected to reduce solar output.`,
        )
      : t(
          "짙은 구름 구간이 짧아 태양광 출력은 비교적 안정적일 전망입니다.",
          "Dense-cloud periods are limited, so solar output should remain relatively stable.",
        );
  const windImpact =
    summary.strongestWind.averageWindSpeed >= 8
      ? t(
          `${formatForecastTime(summary.strongestWind.timestamp, language)} 전후 바람이 강해지며 풍력 출력이 상승할 전망입니다.`,
          `Stronger winds near ${formatForecastTime(summary.strongestWind.timestamp, language)} should lift wind output.`,
        )
      : t(
          "정격 풍속보다 낮은 구간이 이어져 풍력은 부분 출력이 예상됩니다.",
          "Winds remain below rated speed, so wind generation is expected to stay at partial output.",
        );

  return (
    <section
      className="panel short-term-forecast-panel"
      aria-labelledby="short-term-forecast-title"
    >
      <div className="panel-head forecast-panel-head">
        <div>
          <span className="section-kicker">
            <Cloud size={14} /> WEATHER IMPACT
          </span>
          <h2 id="short-term-forecast-title">
            {t(
              "단기예보 지도 · 다음 24시간",
              "Short-term forecast map · next 24 hours",
            )}
          </h2>
          <p>
            {t(
              "시간을 움직여 구름과 바람의 이동을 확인하세요. 색이 짙을수록 해당 격자의 예상 운량이 높습니다. 격자 예보를 연속 보간한 표현이며 위성 영상이나 실제 구름 두께가 아닙니다.",
              "Move through time to follow clouds and wind. Darker color means higher forecast cloud cover in that grid area. This is a continuous interpolation of gridded forecasts, not satellite imagery or physical cloud thickness.",
            )}
          </p>
        </div>
        <span
          className={`forecast-source-chip ${visibleConnection}`}
          role="status"
        >
          <i /> {connectionLabel}
        </span>
      </div>

      <div className="forecast-layout">
        <div className="forecast-map-column">
          <div className="forecast-map-shell">
            <div
              ref={containerRef}
              className="forecast-map"
              role="region"
              aria-label={t(
                "24시간 구름 이동 예보 지도",
                "24-hour cloud movement forecast map",
              )}
            />
            {mapStatus !== "ready" && (
              <div
                className={`forecast-map-status is-${mapStatus}`}
                role={mapStatus === "error" ? "alert" : "status"}
              >
                {mapStatus === "loading" ? (
                  <>
                    <RefreshCw size={18} />
                    <span>
                      {t(
                        "예보 지도를 불러오는 중입니다.",
                        "Loading the forecast map.",
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Cloud size={19} />
                    <strong>
                      {t(
                        "배경 지도를 불러오지 못했습니다.",
                        "The base map could not be loaded.",
                      )}
                    </strong>
                    <span>
                      {t(
                        "예보 수치와 시간 재생은 계속 사용할 수 있습니다.",
                        "Forecast values and timeline playback remain available.",
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMapRevision(
                          (revision) => revision + 1,
                        )
                      }
                    >
                      <RefreshCw size={14} />
                      {t("지도 다시 불러오기", "Retry map")}
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="forecast-time-badge">
              <Cloud
                size={15}
                fill={
                  activeFrame.averageCloudCover > 65
                    ? "currentColor"
                    : "none"
                }
              />
              <span>
                {formatForecastTime(
                  activeFrame.timestamp,
                  language,
                )}
              </span>
              <strong>
                {t("구름", "Cloud")}{" "}
                {activeFrame.averageCloudCover}% ·{" "}
                {cloudCoverBand(
                  activeFrame.averageCloudCover,
                  language,
                )}
              </strong>
            </div>
            <div
              className="forecast-map-key"
              aria-label={t(
                `운량 색상 농도. 현재 평균 ${activeFrame.averageCloudCover}%`,
                `Cloud-cover color density. Current average ${activeFrame.averageCloudCover}%`,
              )}
            >
              <div className="forecast-map-key-head">
                <span>
                  {t("운량 색상 농도", "Cloud-cover density")}
                </span>
                <strong>
                  {activeFrame.averageCloudCover}%
                </strong>
              </div>
              <div
                className="forecast-cloud-scale"
                aria-hidden="true"
              >
                <i
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(198,210,218,.25) 0%, #8ca2b0 8%, #5b7588 18%, #3b576d 35%, #284258 55%, #193046 75%, #0d1f31 100%)",
                  }}
                />
                <b
                  style={{
                    left: `${Math.min(
                      98,
                      Math.max(
                        2,
                        activeFrame.averageCloudCover,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="forecast-cloud-labels">
                <span>{t("맑음", "Clear")}</span>
                <span>{t("옅음", "Thin")}</span>
                <span>{t("짙음", "Dense")}</span>
              </div>
            </div>
          </div>

          <div className="forecast-timeline">
            <button
              type="button"
              className="forecast-play-button"
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={
                isPlaying
                  ? t("예보 재생 일시정지", "Pause forecast")
                  : t("예보 재생", "Play forecast")
              }
              aria-pressed={isPlaying}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>
            <div className="forecast-range-wrap">
              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={selectedIndex}
                onChange={(event) => {
                  setSelectedIndex(Number(event.target.value));
                  setIsPlaying(false);
                }}
                aria-label={t(
                  "예보 시간 선택",
                  "Select forecast hour",
                )}
                aria-valuetext={formatForecastTime(
                  activeFrame.timestamp,
                  language,
                )}
                style={{
                  "--forecast-progress": `${
                    frames.length > 1
                      ? (selectedIndex / (frames.length - 1)) * 100
                      : 0
                  }%`,
                } as React.CSSProperties}
              />
              <div className="forecast-range-labels">
                <span>{t("현재", "Now")}</span>
                <span>+6h</span>
                <span>+12h</span>
                <span>+18h</span>
                <span>+23h</span>
              </div>
            </div>
          </div>
        </div>

        <aside
          className="forecast-impact"
          aria-label={t(
            "24시간 발전량 영향 분석",
            "24-hour generation impact analysis",
          )}
        >
          <div className="forecast-now-card">
            <span>
              <Sparkles size={15} />{" "}
              {t("선택 시각 예상 출력", "Selected-hour output")}
            </span>
            <div>
              <p>
                <Sun size={17} />
                <span>{t("태양광", "Solar")}</span>
                <strong>
                  {(activeFrame.solarGenerationKw / 1_000).toFixed(
                    2,
                  )}
                  <small>MW</small>
                </strong>
              </p>
              <p>
                <Wind size={17} />
                <span>{t("풍력", "Wind")}</span>
                <strong>
                  {(activeFrame.windGenerationKw / 1_000).toFixed(
                    2,
                  )}
                  <small>MW</small>
                </strong>
              </p>
            </div>
          </div>

          <div className="forecast-total-grid">
            <article>
              <span>
                <Sun size={16} />{" "}
                {t("24시간 태양광", "24h solar")}
              </span>
              <strong>
                {summary.solarEnergyMWh.toFixed(1)}
                <small>MWh</small>
              </strong>
              <p>
                {t("최대", "Peak")}{" "}
                {(summary.solarPeak.solarGenerationKw / 1_000).toFixed(
                  2,
                )}
                MW ·{" "}
                {formatForecastTime(
                  summary.solarPeak.timestamp,
                  language,
                )}
              </p>
            </article>
            <article>
              <span>
                <Wind size={16} />{" "}
                {t("24시간 풍력", "24h wind")}
              </span>
              <strong>
                {summary.windEnergyMWh.toFixed(1)}
                <small>MWh</small>
              </strong>
              <p>
                {t("최대", "Peak")}{" "}
                {(summary.windPeak.windGenerationKw / 1_000).toFixed(
                  2,
                )}
                MW ·{" "}
                {formatForecastTime(
                  summary.windPeak.timestamp,
                  language,
                )}
              </p>
            </article>
          </div>

          <div className="forecast-influence-list">
            <p>
              <CloudRain size={17} />
              <span>{cloudImpact}</span>
            </p>
            <p>
              <Wind size={17} />
              <span>{windImpact}</span>
            </p>
          </div>
          <p className="forecast-method-note">
            <RefreshCw size={13} />
            {visibleForecast.provider === "kma"
              ? t(
                  "서버에 연결된 기상청 단기예보 격자를 사용합니다. 발전량은 설비용량과 기상 변수로 산정한 시연용 추정치입니다.",
                  "Uses the KMA short-term forecast grid connected on the server. Generation remains a demonstration estimate from capacity and weather variables.",
                )
              : visibleForecast.provider === "open-meteo"
                ? t(
                    "현재 배포에는 기상청 서버 키가 없어 Open-Meteo 공개 격자 예보를 사용합니다. 발전량은 시연용 추정치입니다.",
                    "This deployment has no server-side KMA key, so it uses the public Open-Meteo grid forecast. Generation is a demonstration estimate.",
                  )
                : t(
                    "외부 예보 연결에 실패해 시연용 합성 예보를 사용합니다. 실제 계통 운영에 사용할 수 없습니다.",
                    "External forecasts were unavailable, so a synthetic demonstration forecast is shown. Do not use it for grid operations.",
                  )}
          </p>
        </aside>
      </div>
    </section>
  );
}
