"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Layers3 } from "lucide-react";
import type {
  LayerSpecification,
  Map as MapLibreMap,
  VectorSourceSpecification,
} from "maplibre-gl";
import type { Language } from "@/lib/i18n";
import type { Region } from "@/lib/types";

const REGION_VIEW: Record<
  Region,
  {
    center: [number, number];
    zoom: number;
    label: Record<Language, string>;
    href: string;
  }
> = {
  jeju: {
    center: [126.5783, 33.4197],
    zoom: 10.42,
    label: {
      ko: "제주 전력 인프라",
      en: "Jeju power infrastructure",
    },
    href: "https://openinframap.org/#10.42/33.4197/126.5783",
  },
  honam: {
    center: [126.86, 35.06],
    zoom: 8.35,
    label: {
      ko: "호남 전력 인프라",
      en: "Honam power infrastructure",
    },
    href: "https://openinframap.org/#8.35/35.0600/126.8600",
  },
};

const BASE_STYLE_URL =
  "https://tiles.openfreemap.org/styles/positron";
const INFRASTRUCTURE_SOURCE_ID = "infrastructure";
const INFRASTRUCTURE_SOURCE: VectorSourceSpecification = {
  type: "vector",
  tiles: [
    "https://openinframap.org/tiles/{z}/{x}/{y}.pbf",
  ],
  minzoom: 0,
  maxzoom: 17,
  attribution:
    '<a href="https://openinframap.org/copyright">OpenInfraMap</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>',
};

const MAP_LOCALE: Record<Language, Record<string, string>> = {
  ko: {
    "Map.Title": "전력 인프라 지도",
    "NavigationControl.ResetBearing": "북쪽으로 방향 초기화",
    "NavigationControl.ZoomIn": "확대",
    "NavigationControl.ZoomOut": "축소",
    "AttributionControl.ToggleAttribution": "지도 출처 보기",
    "CooperativeGesturesHandler.WindowsHelpText":
      "Ctrl 키를 누른 채 스크롤해 지도를 확대하세요",
    "CooperativeGesturesHandler.MacHelpText":
      "⌘ 키를 누른 채 스크롤해 지도를 확대하세요",
    "CooperativeGesturesHandler.MobileHelpText":
      "두 손가락으로 지도를 이동하세요",
  },
  en: {
    "Map.Title": "Power infrastructure map",
    "NavigationControl.ResetBearing": "Reset bearing to north",
    "NavigationControl.ZoomIn": "Zoom in",
    "NavigationControl.ZoomOut": "Zoom out",
    "AttributionControl.ToggleAttribution": "Toggle attribution",
    "CooperativeGesturesHandler.WindowsHelpText":
      "Use Ctrl + scroll to zoom the map",
    "CooperativeGesturesHandler.MacHelpText":
      "Use ⌘ + scroll to zoom the map",
    "CooperativeGesturesHandler.MobileHelpText":
      "Use two fingers to move the map",
  },
};

const MAP_COPY: Record<
  Language,
  {
    aria: string;
    loading: string;
    baseError: string;
    legend: string;
    substation: string;
    solar: string;
    wind: string;
    line: string;
    cable: string;
    layerWarning: string;
    open: string;
  }
> = {
  ko: {
    aria:
      "변전소, 변환소, 태양광·풍력 발전소, 고전압 선로와 지중 케이블",
    loading: "기본 지도를 불러오는 중",
    baseError:
      "기본 지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    legend: "표시 레이어",
    substation: "변전소·변환소",
    solar: "태양광 발전",
    wind: "풍력 발전",
    line: "고전압 선로",
    cable: "지중 케이블",
    layerWarning:
      "일부 전력 설비 데이터가 일시적으로 표시되지 않을 수 있습니다.",
    open: "OpenInfraMap에서 크게 보기",
  },
  en: {
    aria:
      "Substations, converter stations, solar and wind generation, high-voltage lines, and underground cables",
    loading: "Loading the base map",
    baseError:
      "The base map could not be loaded. Please try again shortly.",
    legend: "Visible layers",
    substation: "Substations & converters",
    solar: "Solar generation",
    wind: "Wind generation",
    line: "High-voltage lines",
    cable: "Underground cables",
    layerWarning:
      "Some power infrastructure data may be temporarily unavailable.",
    open: "Open larger in OpenInfraMap",
  },
};

const infrastructureLayers = [
  {
      id: "power-line-halo",
      type: "line",
      source: "infrastructure",
      "source-layer": "power_line",
      paint: {
        "line-color": "rgba(255,255,255,.86)",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          1.4,
          13,
          5,
        ],
      },
    },
    {
      id: "power-line",
      type: "line",
      source: "infrastructure",
      "source-layer": "power_line",
      filter: [
        "!",
        [
          "any",
          ["==", ["get", "tunnel"], true],
          ["==", ["get", "location"], "underground"],
          ["==", ["get", "type"], "cable"],
        ],
      ],
      paint: {
        "line-color": [
          "interpolate",
          ["linear"],
          ["to-number", ["coalesce", ["get", "voltage"], 0]],
          0,
          "#9b7f64",
          66,
          "#e49a45",
          154,
          "#d55c45",
          345,
          "#7651a8",
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          0.7,
          13,
          2.7,
        ],
        "line-opacity": 0.88,
      },
    },
    {
      id: "power-cable",
      type: "line",
      source: "infrastructure",
      "source-layer": "power_line",
      filter: [
        "any",
        ["==", ["get", "tunnel"], true],
        ["==", ["get", "location"], "underground"],
        ["==", ["get", "type"], "cable"],
      ],
      paint: {
        "line-color": "#546477",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          1,
          14,
          3,
        ],
        "line-dasharray": [3, 2],
        "line-opacity": 0.95,
      },
    },
    {
      id: "substation-area",
      type: "fill",
      source: "infrastructure",
      "source-layer": "power_substation",
      paint: {
        "fill-color": "#7d57ad",
        "fill-opacity": 0.24,
        "fill-outline-color": "#654291",
      },
    },
    {
      id: "substation-point",
      type: "circle",
      source: "infrastructure",
      "source-layer": "power_substation_point",
      paint: {
        "circle-color": "#7d57ad",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          2.5,
          13,
          6,
        ],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.4,
        "circle-opacity": 0.94,
      },
    },
    {
      id: "solar-area",
      type: "fill",
      source: "infrastructure",
      "source-layer": "power_generator_area",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "fill-color": "#e1aa2d",
        "fill-opacity": 0.38,
        "fill-outline-color": "#b77c00",
      },
    },
    {
      id: "solar-plant",
      type: "circle",
      source: "infrastructure",
      "source-layer": "power_plant_point",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "circle-color": "#f2b632",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          3,
          13,
          7,
        ],
        "circle-stroke-color": "#fff7dd",
        "circle-stroke-width": 1.5,
      },
    },
    {
      id: "solar-generator",
      type: "circle",
      source: "infrastructure",
      "source-layer": "power_generator",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "circle-color": "#f2b632",
        "circle-radius": 3.2,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    },
    {
      id: "wind-plant",
      type: "circle",
      source: "infrastructure",
      "source-layer": "power_plant_point",
      filter: ["==", ["get", "source"], "wind"],
      paint: {
        "circle-color": "#3188a8",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7,
          3,
          13,
          7,
        ],
        "circle-stroke-color": "#e5f8ff",
        "circle-stroke-width": 1.5,
      },
    },
    {
      id: "wind-generator",
      type: "circle",
      source: "infrastructure",
      "source-layer": "power_generator",
      filter: ["==", ["get", "source"], "wind"],
      paint: {
        "circle-color": "#3188a8",
        "circle-radius": 3.7,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
  },
] as LayerSpecification[];

export function InfrastructureMap({
  region,
  language = "ko",
}: {
  region: Region;
  language?: Language;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapKey = `${region}:${language}`;
  const [baseState, setBaseState] = useState<{
    key: string;
    value: "loading" | "ready" | "failed";
  }>({ key: mapKey, value: "loading" });
  const [degradedMapKey, setDegradedMapKey] = useState<
    string | null
  >(null);
  const baseStatus =
    baseState.key === mapKey ? baseState.value : "loading";
  const infrastructureDegraded =
    degradedMapKey === mapKey;
  const view = REGION_VIEW[region];
  const copy = MAP_COPY[language];

  useEffect(() => {
    let disposed = false;
    let baseStyleLoaded = false;
    const mapView = REGION_VIEW[region];
    const activeMapKey = `${region}:${language}`;

    const baseLoadTimeout = window.setTimeout(() => {
      if (!disposed) {
        setBaseState({
          key: activeMapKey,
          value: "failed",
        });
      }
    }, 15_000);

    async function createMap() {
      try {
        if (!containerRef.current) return;
        const maplibregl = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: BASE_STYLE_URL,
          center: mapView.center,
          zoom: mapView.zoom,
          minZoom: 6,
          maxZoom: 17,
          attributionControl: false,
          cooperativeGestures: true,
          locale: MAP_LOCALE[language],
        });
        mapRef.current = map;

        map.on("error", (event) => {
          const sourceId = (
            event as typeof event & { sourceId?: string }
          ).sourceId;
          const message = event.error?.message ?? "";
          const infrastructureError =
            sourceId === INFRASTRUCTURE_SOURCE_ID ||
            message.includes("openinframap.org");

          if (infrastructureError) {
            if (!disposed) {
              setDegradedMapKey(activeMapKey);
            }
            return;
          }

          if (!baseStyleLoaded) {
            console.warn("[GridFlow map]", message);
          }
        });

        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            visualizePitch: true,
          }),
          "bottom-right",
        );
        map.addControl(
          new maplibregl.AttributionControl({ compact: true }),
          "bottom-left",
        );

        map.once("style.load", () => {
          baseStyleLoaded = true;
          window.clearTimeout(baseLoadTimeout);
          if (disposed) return;

          setDegradedMapKey((currentKey) =>
            currentKey === activeMapKey ? null : currentKey,
          );
          setBaseState({
            key: activeMapKey,
            value: "ready",
          });

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
                  `[GridFlow base label: ${layer.id}]`,
                  error,
                );
              }
            }
          }

          let infrastructureSourceReady = true;
          try {
            if (!map.getSource(INFRASTRUCTURE_SOURCE_ID)) {
              map.addSource(
                INFRASTRUCTURE_SOURCE_ID,
                INFRASTRUCTURE_SOURCE,
              );
            }
          } catch (error) {
            infrastructureSourceReady = false;
            setDegradedMapKey(activeMapKey);
            console.warn(
              "[GridFlow infrastructure source]",
              error,
            );
          }

          if (infrastructureSourceReady) {
            const firstLabelLayer = map
              .getStyle()
              .layers?.find((layer) => layer.type === "symbol")
              ?.id;

            for (const layer of infrastructureLayers) {
              try {
                if (!map.getLayer(layer.id)) {
                  map.addLayer(layer, firstLabelLayer);
                }
              } catch (error) {
                setDegradedMapKey(activeMapKey);
                console.warn(
                  `[GridFlow infrastructure layer: ${layer.id}]`,
                  error,
                );
              }
            }
          }
        });
      } catch {
        window.clearTimeout(baseLoadTimeout);
        if (!disposed) {
          setBaseState({
            key: activeMapKey,
            value: "failed",
          });
        }
      }
    }

    void createMap();

    return () => {
      disposed = true;
      window.clearTimeout(baseLoadTimeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [language, region]);

  return (
    <div className="infrastructure-map-shell">
      <div
        ref={containerRef}
        className="infrastructure-map"
        role="region"
        aria-label={`${view.label[language]}: ${copy.aria}`}
      />
      {baseStatus === "loading" && (
        <div
          className="map-status"
          role="status"
          aria-live="polite"
        >
          <span className="map-spinner" />
          {copy.loading}
        </div>
      )}
      {baseStatus === "failed" && (
        <div
          className="map-status map-error"
          role="alert"
        >
          {copy.baseError}
        </div>
      )}
      <div className="map-layer-card">
        <span className="map-layer-title">
          <Layers3 size={14} /> {copy.legend}
        </span>
        <span>
          <i className="legend-substation" />
          {copy.substation}
        </span>
        <span>
          <i className="legend-solar" />
          {copy.solar}
        </span>
        <span>
          <i className="legend-wind" />
          {copy.wind}
        </span>
        <span>
          <i className="legend-line" />
          {copy.line}
        </span>
        <span>
          <i className="legend-cable" />
          {copy.cable}
        </span>
        {infrastructureDegraded && (
          <span role="status">⚠ {copy.layerWarning}</span>
        )}
      </div>
      <a
        className="map-open-link"
        href={view.href}
        target="_blank"
        rel="noreferrer"
      >
        {copy.open} <ExternalLink size={13} />
      </a>
    </div>
  );
}
