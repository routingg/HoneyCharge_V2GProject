"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Layers3 } from "lucide-react";
import type {
  FilterSpecification,
  LayerSpecification,
  Map as MapLibreMap,
  VectorSourceSpecification,
} from "maplibre-gl";
import type { Language } from "@/lib/i18n";
import type { Region } from "@/lib/types";

type InfrastructureGroup =
  | "substation"
  | "solar"
  | "wind"
  | "fossil"
  | "hydro"
  | "nuclear"
  | "line"
  | "cable";

type InfrastructureLayer = {
  group: InfrastructureGroup;
  layer: LayerSpecification;
  interactive?: boolean;
  tiltedOnly?: boolean;
};

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

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const INFRASTRUCTURE_SOURCE_ID = "infrastructure";
const WIND_ICON_ID = "honeycharge-wind-turbine";
const SOLAR_ICON_ID = "honeycharge-solar-panel";
const TILTED_PITCH_THRESHOLD = 25;

const INFRASTRUCTURE_SOURCE: VectorSourceSpecification = {
  type: "vector",
  tiles: ["https://openinframap.org/tiles/{z}/{x}/{y}.pbf"],
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

const MAP_COPY = {
  ko: {
    aria:
      "변전소, 태양광·풍력·화석·수력·원자력 발전소, 송전선 전압과 회선, 지중 케이블",
    loading: "기본 지도를 불러오는 중",
    baseError:
      "기본 지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    legend: "표시 레이어 · 눌러서 켜기/끄기",
    substation: "변전소·변환소",
    solar: "태양광 발전",
    wind: "풍력 발전",
    fossil: "화석연료 발전",
    hydro: "수력·조력 발전",
    nuclear: "원자력 발전",
    line: "송전선 전압·회선",
    cable: "지중 케이블",
    turnOn: "레이어 켜기",
    turnOff: "레이어 끄기",
    tiltedView: "3D로 전환",
    flatView: "2D로 전환",
    layerWarning:
      "일부 전력 설비 데이터가 일시적으로 표시되지 않을 수 있습니다.",
    open: "OpenInfraMap에서 크게 보기",
    popup: {
      details: "OpenStreetMap 설비 정보",
      unnamed: "이름 없는 전력 설비",
      operator: "운영사",
      source: "발전원",
      method: "발전 방식",
      type: "설비 유형",
      output: "정격 출력",
      plantRole: "발전소 내 역할",
      substation: "변전소 유형",
      voltage: "전압",
      circuits: "회선 수",
      frequency: "주파수",
      location: "설치 위치",
      material: "재질",
      storage: "저장 방식",
      rating: "정격",
      ref: "참조 번호",
      startDate: "가동 시작일",
      construction: "건설 중",
      disused: "사용 중지",
      osmRecord: "OpenStreetMap 원본 보기",
      sourceLayer: "데이터 유형",
      yes: "예",
      no: "아니요",
    },
  },
  en: {
    aria:
      "Substations, solar, wind, fossil, hydro and nuclear generation, transmission voltage and circuits, and underground cables",
    loading: "Loading the base map",
    baseError: "The base map could not be loaded. Please try again shortly.",
    legend: "Map layers · select to show or hide",
    substation: "Substations & converters",
    solar: "Solar generation",
    wind: "Wind generation",
    fossil: "Fossil generation",
    hydro: "Hydro & tidal generation",
    nuclear: "Nuclear generation",
    line: "Transmission voltage & circuits",
    cable: "Underground cables",
    turnOn: "Show layer",
    turnOff: "Hide layer",
    tiltedView: "Switch to 3D",
    flatView: "Switch to 2D",
    layerWarning:
      "Some power infrastructure data may be temporarily unavailable.",
    open: "Open larger in OpenInfraMap",
    popup: {
      details: "OpenStreetMap facility details",
      unnamed: "Unnamed power facility",
      operator: "Operator",
      source: "Energy source",
      method: "Generation method",
      type: "Facility type",
      output: "Rated output",
      plantRole: "Plant role",
      substation: "Substation type",
      voltage: "Voltage",
      circuits: "Circuits",
      frequency: "Frequency",
      location: "Location",
      material: "Material",
      storage: "Storage",
      rating: "Rating",
      ref: "Reference",
      startDate: "Start date",
      construction: "Under construction",
      disused: "Disused",
      osmRecord: "View original on OpenStreetMap",
      sourceLayer: "Data type",
      yes: "Yes",
      no: "No",
    },
  },
} as const;

const GROUPS: {
  id: InfrastructureGroup;
  iconClass: string;
}[] = [
  { id: "substation", iconClass: "legend-substation" },
  { id: "solar", iconClass: "legend-solar" },
  { id: "wind", iconClass: "legend-wind" },
  { id: "fossil", iconClass: "legend-fossil" },
  { id: "hydro", iconClass: "legend-hydro" },
  { id: "nuclear", iconClass: "legend-nuclear" },
  { id: "line", iconClass: "legend-line" },
  { id: "cable", iconClass: "legend-cable" },
];

const DEFAULT_VISIBILITY: Record<InfrastructureGroup, boolean> = {
  substation: true,
  solar: true,
  wind: true,
  fossil: true,
  hydro: true,
  nuclear: true,
  line: true,
  cable: true,
};

const UNDERGROUND_FILTER = [
  "any",
  ["==", ["get", "tunnel"], true],
  ["==", ["get", "location"], "underground"],
  ["==", ["get", "type"], "cable"],
] as unknown as FilterSpecification;

const OVERHEAD_FILTER = [
  "!",
  UNDERGROUND_FILTER,
] as unknown as FilterSpecification;
const FOSSIL_FILTER = [
  "match",
  ["get", "source"],
  ["coal", "gas", "oil", "diesel", "fossil"],
  true,
  false,
] as unknown as FilterSpecification;
const HYDRO_FILTER = [
  "match",
  ["get", "source"],
  ["hydro", "water", "tidal", "wave"],
  true,
  false,
] as unknown as FilterSpecification;

const VOLTAGE_LABEL = [
  "case",
  ["all", ["has", "voltage"], ["has", "circuits"]],
  [
    "concat",
    ["to-string", ["get", "voltage"]],
    " kV · ",
    ["to-string", ["get", "circuits"]],
    "C",
  ],
  ["has", "voltage"],
  ["concat", ["to-string", ["get", "voltage"]], " kV"],
  ["has", "circuits"],
  ["concat", ["to-string", ["get", "circuits"]], "C"],
  "",
];

const infrastructureLayers: InfrastructureLayer[] = [
  {
    group: "line",
    layer: {
      id: "power-line-halo",
      type: "line",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_line",
      filter: OVERHEAD_FILTER,
      paint: {
        "line-color": "rgba(255,255,255,.86)",
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1.8, 13, 5.6],
      },
    } as LayerSpecification,
  },
  {
    group: "line",
    interactive: true,
    layer: {
      id: "power-line",
      type: "line",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_line",
      filter: OVERHEAD_FILTER,
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
          [
            "+",
            0.55,
            [
              "*",
              0.16,
              ["to-number", ["coalesce", ["get", "circuits"], 1]],
            ],
          ],
          13,
          [
            "+",
            1.8,
            [
              "*",
              0.32,
              ["to-number", ["coalesce", ["get", "circuits"], 1]],
            ],
          ],
        ],
        "line-opacity": 0.9,
      },
    } as LayerSpecification,
  },
  {
    group: "line",
    layer: {
      id: "power-line-voltage-label",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_line",
      minzoom: 10.5,
      filter: OVERHEAD_FILTER,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 320,
        "text-field": VOLTAGE_LABEL,
        "text-size": 10,
        "text-max-angle": 28,
      },
      paint: {
        "text-color": "#684c44",
        "text-halo-color": "rgba(255,255,255,.94)",
        "text-halo-width": 1.6,
      },
    } as LayerSpecification,
  },
  {
    group: "cable",
    interactive: true,
    layer: {
      id: "power-cable",
      type: "line",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_line",
      filter: UNDERGROUND_FILTER,
      paint: {
        "line-color": "#546477",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 3],
        "line-dasharray": [3, 2],
        "line-opacity": 0.95,
      },
    } as LayerSpecification,
  },
  {
    group: "cable",
    layer: {
      id: "power-cable-voltage-label",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_line",
      minzoom: 11,
      filter: UNDERGROUND_FILTER,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 320,
        "text-field": VOLTAGE_LABEL,
        "text-size": 9.5,
        "text-max-angle": 28,
      },
      paint: {
        "text-color": "#425264",
        "text-halo-color": "rgba(255,255,255,.94)",
        "text-halo-width": 1.5,
      },
    } as LayerSpecification,
  },
  {
    group: "fossil",
    interactive: true,
    layer: {
      id: "fossil-plant-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant",
      filter: FOSSIL_FILTER,
      paint: {
        "fill-color": "#79574b",
        "fill-opacity": 0.3,
        "fill-outline-color": "#5c3e35",
      },
    } as LayerSpecification,
  },
  {
    group: "fossil",
    interactive: true,
    layer: {
      id: "fossil-plant",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      filter: FOSSIL_FILTER,
      paint: {
        "circle-color": "#79574b",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3.8, 13, 7.6],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.5,
      },
    } as LayerSpecification,
  },
  {
    group: "fossil",
    interactive: true,
    layer: {
      id: "fossil-generator-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator_area",
      filter: FOSSIL_FILTER,
      paint: {
        "fill-color": "#79574b",
        "fill-opacity": 0.38,
        "fill-outline-color": "#5c3e35",
      },
    } as LayerSpecification,
  },
  {
    group: "fossil",
    interactive: true,
    layer: {
      id: "fossil-generator",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      filter: FOSSIL_FILTER,
      paint: {
        "circle-color": "#79574b",
        "circle-radius": 3.7,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    } as LayerSpecification,
  },
  {
    group: "hydro",
    interactive: true,
    layer: {
      id: "hydro-plant-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant",
      filter: HYDRO_FILTER,
      paint: {
        "fill-color": "#377fd0",
        "fill-opacity": 0.28,
        "fill-outline-color": "#2363ac",
      },
    } as LayerSpecification,
  },
  {
    group: "hydro",
    interactive: true,
    layer: {
      id: "hydro-plant",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      filter: HYDRO_FILTER,
      paint: {
        "circle-color": "#377fd0",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3.8, 13, 7.6],
        "circle-stroke-color": "#eef7ff",
        "circle-stroke-width": 1.5,
      },
    } as LayerSpecification,
  },
  {
    group: "hydro",
    interactive: true,
    layer: {
      id: "hydro-generator-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator_area",
      filter: HYDRO_FILTER,
      paint: {
        "fill-color": "#377fd0",
        "fill-opacity": 0.38,
        "fill-outline-color": "#2363ac",
      },
    } as LayerSpecification,
  },
  {
    group: "hydro",
    interactive: true,
    layer: {
      id: "hydro-generator",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      filter: HYDRO_FILTER,
      paint: {
        "circle-color": "#377fd0",
        "circle-radius": 3.7,
        "circle-stroke-color": "#eef7ff",
        "circle-stroke-width": 1,
      },
    } as LayerSpecification,
  },
  {
    group: "nuclear",
    interactive: true,
    layer: {
      id: "nuclear-plant-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant",
      filter: ["==", ["get", "source"], "nuclear"],
      paint: {
        "fill-color": "#ce5577",
        "fill-opacity": 0.3,
        "fill-outline-color": "#a13c5a",
      },
    } as LayerSpecification,
  },
  {
    group: "nuclear",
    interactive: true,
    layer: {
      id: "nuclear-generator-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator_area",
      filter: ["==", ["get", "source"], "nuclear"],
      paint: {
        "fill-color": "#ce5577",
        "fill-opacity": 0.4,
        "fill-outline-color": "#a13c5a",
      },
    } as LayerSpecification,
  },
  {
    group: "nuclear",
    interactive: true,
    layer: {
      id: "nuclear-generator",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      filter: ["==", ["get", "source"], "nuclear"],
      paint: {
        "circle-color": "#ce5577",
        "circle-radius": 4,
        "circle-stroke-color": "#fff0f5",
        "circle-stroke-width": 1.2,
      },
    } as LayerSpecification,
  },
  {
    group: "nuclear",
    interactive: true,
    layer: {
      id: "nuclear-plant",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      filter: ["==", ["get", "source"], "nuclear"],
      paint: {
        "circle-color": "#ce5577",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 4.2, 13, 8],
        "circle-stroke-color": "#fff0f5",
        "circle-stroke-width": 1.7,
      },
    } as LayerSpecification,
  },
  {
    group: "substation",
    interactive: true,
    layer: {
      id: "substation-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_substation",
      paint: {
        "fill-color": "#7d57ad",
        "fill-opacity": 0.24,
        "fill-outline-color": "#654291",
      },
    } as LayerSpecification,
  },
  {
    group: "substation",
    interactive: true,
    layer: {
      id: "substation-point",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_substation_point",
      paint: {
        "circle-color": "#7d57ad",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 2.5, 13, 6],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.4,
        "circle-opacity": 0.94,
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    layer: {
      id: "solar-plant-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "fill-color": "#e1aa2d",
        "fill-opacity": 0.26,
        "fill-outline-color": "#b77c00",
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    layer: {
      id: "solar-generator-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator_area",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "fill-color": "#e1aa2d",
        "fill-opacity": 0.42,
        "fill-outline-color": "#b77c00",
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    layer: {
      id: "solar-plant",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "circle-color": "#f2b632",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3, 13, 7],
        "circle-stroke-color": "#fff7dd",
        "circle-stroke-width": 1.5,
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    layer: {
      id: "solar-generator",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      filter: ["==", ["get", "source"], "solar"],
      paint: {
        "circle-color": "#f2b632",
        "circle-radius": 3.2,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    } as LayerSpecification,
  },
  {
    group: "wind",
    interactive: true,
    layer: {
      id: "wind-plant-area",
      type: "fill",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant",
      filter: ["==", ["get", "source"], "wind"],
      paint: {
        "fill-color": "#3188a8",
        "fill-opacity": 0.2,
        "fill-outline-color": "#22718e",
      },
    } as LayerSpecification,
  },
  {
    group: "wind",
    interactive: true,
    layer: {
      id: "wind-plant",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      filter: ["==", ["get", "source"], "wind"],
      paint: {
        "circle-color": "#3188a8",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3, 13, 7],
        "circle-stroke-color": "#e5f8ff",
        "circle-stroke-width": 1.5,
      },
    } as LayerSpecification,
  },
  {
    group: "wind",
    interactive: true,
    layer: {
      id: "wind-generator",
      type: "circle",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      filter: ["==", ["get", "source"], "wind"],
      paint: {
        "circle-color": "#3188a8",
        "circle-radius": 3.7,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1,
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    tiltedOnly: true,
    layer: {
      id: "solar-tilted-plant-icon",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      minzoom: 8,
      filter: ["==", ["get", "source"], "solar"],
      layout: {
        "icon-image": SOLAR_ICON_ID,
        "icon-anchor": "bottom",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 13, 0.85],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
      },
    } as LayerSpecification,
  },
  {
    group: "solar",
    interactive: true,
    tiltedOnly: true,
    layer: {
      id: "solar-tilted-generator-icon",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      minzoom: 11.2,
      filter: ["==", ["get", "source"], "solar"],
      layout: {
        "icon-image": SOLAR_ICON_ID,
        "icon-anchor": "bottom",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 11, 0.42, 15, 0.72],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
      },
    } as LayerSpecification,
  },
  {
    group: "wind",
    interactive: true,
    tiltedOnly: true,
    layer: {
      id: "wind-tilted-plant-icon",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_plant_point",
      minzoom: 8,
      filter: ["==", ["get", "source"], "wind"],
      layout: {
        "icon-image": WIND_ICON_ID,
        "icon-anchor": "bottom",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 13, 0.88],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
      },
    } as LayerSpecification,
  },
  {
    group: "wind",
    interactive: true,
    tiltedOnly: true,
    layer: {
      id: "wind-tilted-generator-icon",
      type: "symbol",
      source: INFRASTRUCTURE_SOURCE_ID,
      "source-layer": "power_generator",
      minzoom: 10.5,
      filter: ["==", ["get", "source"], "wind"],
      layout: {
        "icon-image": WIND_ICON_ID,
        "icon-anchor": "bottom",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.42, 15, 0.76],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-pitch-alignment": "viewport",
        "icon-rotation-alignment": "viewport",
      },
    } as LayerSpecification,
  },
];

const INTERACTIVE_LAYER_IDS = infrastructureLayers
  .filter(({ interactive }) => interactive)
  .map(({ layer }) => layer.id);

const GROUP_BY_LAYER_ID = new Map(
  infrastructureLayers.map(({ group, layer }) => [layer.id, group]),
);

function createInfrastructureIcon(kind: "wind" | "solar") {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.scale(2, 2);
  context.lineJoin = "round";
  context.lineCap = "round";

  context.fillStyle = "rgba(19, 47, 39, .2)";
  context.beginPath();
  context.ellipse(24, 44, 15, 3, 0, 0, Math.PI * 2);
  context.fill();

  if (kind === "wind") {
    context.fillStyle = "#f8fcfa";
    context.strokeStyle = "#193d35";
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(21, 42);
    context.lineTo(23, 20);
    context.lineTo(26, 20);
    context.lineTo(29, 42);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#4aa58d";
    context.beginPath();
    context.roundRect(17, 40, 15, 4, 2);
    context.fill();
    context.stroke();

    context.strokeStyle = "#183d35";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(24, 19);
    context.lineTo(24, 4.5);
    context.moveTo(24, 19);
    context.lineTo(10.5, 27);
    context.moveTo(24, 19);
    context.lineTo(38.5, 26);
    context.stroke();

    context.fillStyle = "#f8fcfa";
    context.lineWidth = 2.2;
    context.beginPath();
    context.arc(24, 19, 4.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  } else {
    context.strokeStyle = "#193d35";
    context.lineWidth = 2.1;
    context.fillStyle = "#f8fcfa";
    context.beginPath();
    context.moveTo(20, 31);
    context.lineTo(19, 42);
    context.moveTo(30, 29);
    context.lineTo(31, 42);
    context.stroke();

    const panel = new Path2D();
    panel.moveTo(8, 17);
    panel.lineTo(37, 12);
    panel.lineTo(42, 29);
    panel.lineTo(12, 34);
    panel.closePath();
    context.fillStyle = "#4b9cc9";
    context.fill(panel);
    context.stroke(panel);

    context.strokeStyle = "rgba(238, 251, 255, .86)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(18, 15.5);
    context.lineTo(22, 32);
    context.moveTo(28, 14);
    context.lineTo(32, 30.5);
    context.moveTo(10, 22.5);
    context.lineTo(39, 18);
    context.moveTo(11, 28.5);
    context.lineTo(41, 24);
    context.stroke();

    context.strokeStyle = "#193d35";
    context.lineWidth = 2.1;
    context.beginPath();
    context.moveTo(13, 43);
    context.lineTo(37, 43);
    context.stroke();
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function applyGroupVisibility(
  map: MapLibreMap,
  group: InfrastructureGroup,
  visible: boolean,
  tilted: boolean,
) {
  for (const definition of infrastructureLayers) {
    if (definition.group !== group || !map.getLayer(definition.layer.id)) {
      continue;
    }

    const shouldShow =
      visible && (!definition.tiltedOnly || tilted);
    map.setLayoutProperty(
      definition.layer.id,
      "visibility",
      shouldShow ? "visible" : "none",
    );
  }
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function displayValue(
  key: string,
  value: unknown,
  language: Language,
  yes: string,
  no: string,
) {
  if (typeof value === "boolean") return value ? yes : no;
  const text = String(value);

  if (key === "output" && Number.isFinite(Number(value))) {
    return `${Number(value).toLocaleString(language === "ko" ? "ko-KR" : "en-US")} MW`;
  }
  if (key.startsWith("voltage") && Number.isFinite(Number(value))) {
    return `${Number(value).toLocaleString(language === "ko" ? "ko-KR" : "en-US")} kV`;
  }
  if (key === "frequency" && Number.isFinite(Number(value))) {
    return `${text} Hz`;
  }
  if (key === "circuits" && Number.isFinite(Number(value))) {
    return language === "ko" ? `${text} 회선` : `${text} circuits`;
  }
  return text;
}

function buildFeaturePopup(
  properties: Record<string, unknown>,
  sourceLayer: string,
  group: InfrastructureGroup | undefined,
  language: Language,
) {
  const copy = MAP_COPY[language];
  const popupCopy = copy.popup;
  const container = document.createElement("article");
  container.className = "grid-map-popup";

  const eyebrow = document.createElement("p");
  eyebrow.className = "grid-map-popup-eyebrow";
  eyebrow.textContent = popupCopy.details;
  container.appendChild(eyebrow);

  const title = document.createElement("h4");
  title.className = "grid-map-popup-title";
  const translatedName =
    language === "en" ? properties.name_en : undefined;
  title.textContent = String(
    translatedName ||
      properties.name ||
      (group ? copy[group] : popupCopy.unnamed),
  );
  container.appendChild(title);

  const details = document.createElement("dl");
  details.className = "grid-map-popup-details";

  const rows: {
    key: string;
    label: string;
    value: unknown;
  }[] = [
    { key: "operator", label: popupCopy.operator, value: properties.operator },
    { key: "source", label: popupCopy.source, value: properties.source },
    { key: "method", label: popupCopy.method, value: properties.method },
    { key: "type", label: popupCopy.type, value: properties.type },
    { key: "output", label: popupCopy.output, value: properties.output },
    {
      key: "plant_role",
      label: popupCopy.plantRole,
      value: properties.plant_role,
    },
    {
      key: "substation",
      label: popupCopy.substation,
      value: properties.substation,
    },
    { key: "voltage", label: popupCopy.voltage, value: properties.voltage },
    {
      key: "voltage_2",
      label: `${popupCopy.voltage} 2`,
      value: properties.voltage_2,
    },
    {
      key: "voltage_3",
      label: `${popupCopy.voltage} 3`,
      value: properties.voltage_3,
    },
    {
      key: "voltage_4",
      label: `${popupCopy.voltage} 4`,
      value: properties.voltage_4,
    },
    {
      key: "circuits",
      label: popupCopy.circuits,
      value: properties.circuits,
    },
    {
      key: "frequency",
      label: popupCopy.frequency,
      value: properties.frequency,
    },
    {
      key: "location",
      label: popupCopy.location,
      value: properties.location,
    },
    {
      key: "material",
      label: popupCopy.material,
      value: properties.material,
    },
    {
      key: "storage",
      label: popupCopy.storage,
      value: properties.storage,
    },
    { key: "rating", label: popupCopy.rating, value: properties.rating },
    { key: "ref", label: popupCopy.ref, value: properties.ref },
    {
      key: "start_date",
      label: popupCopy.startDate,
      value: properties.start_date,
    },
    {
      key: "construction",
      label: popupCopy.construction,
      value: properties.construction,
    },
    {
      key: "disused",
      label: popupCopy.disused,
      value: properties.disused,
    },
    {
      key: "source-layer",
      label: popupCopy.sourceLayer,
      value: sourceLayer,
    },
  ];

  for (const row of rows) {
    if (
      row.value === undefined ||
      row.value === null ||
      row.value === "" ||
      row.value === false
    ) {
      continue;
    }

    const term = document.createElement("dt");
    term.textContent = row.label;
    const description = document.createElement("dd");
    description.textContent = displayValue(
      row.key,
      row.value,
      language,
      popupCopy.yes,
      popupCopy.no,
    );
    details.appendChild(term);
    details.appendChild(description);
  }
  container.appendChild(details);

  const osmUrl = safeHttpUrl(properties.url);
  if (osmUrl) {
    const link = document.createElement("a");
    link.className = "grid-map-popup-link";
    link.href = osmUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = popupCopy.osmRecord;
    container.appendChild(link);
  }

  return container;
}

export function InfrastructureMap({
  region,
  language = "ko",
}: {
  region: Region;
  language?: Language;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [visibleGroups, setVisibleGroups] = useState(DEFAULT_VISIBILITY);
  const visibleGroupsRef = useRef(visibleGroups);
  const [isTilted, setIsTilted] = useState(false);
  const mapKey = `${region}:${language}`;
  const [baseState, setBaseState] = useState<{
    key: string;
    value: "loading" | "ready" | "failed";
  }>({ key: mapKey, value: "loading" });
  const [degradedMapKey, setDegradedMapKey] = useState<string | null>(null);
  const baseStatus =
    baseState.key === mapKey ? baseState.value : "loading";
  const infrastructureDegraded = degradedMapKey === mapKey;
  const view = REGION_VIEW[region];
  const copy = MAP_COPY[language];

  useEffect(() => {
    visibleGroupsRef.current = visibleGroups;
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const tilted = map.getPitch() >= TILTED_PITCH_THRESHOLD;
    for (const group of GROUPS) {
      applyGroupVisibility(
        map,
        group.id,
        visibleGroups[group.id],
        tilted,
      );
    }
  }, [visibleGroups]);

  useEffect(() => {
    let disposed = false;
    let baseStyleLoaded = false;
    let activePopup: { remove: () => void } | null = null;
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
          maxPitch: 70,
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
            console.warn("[HoneyCharge map]", message);
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
          setIsTilted(false);

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
                  `[HoneyCharge base label: ${layer.id}]`,
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

            const windIcon = createInfrastructureIcon("wind");
            const solarIcon = createInfrastructureIcon("solar");
            if (windIcon && !map.hasImage(WIND_ICON_ID)) {
              map.addImage(WIND_ICON_ID, windIcon, { pixelRatio: 2 });
            }
            if (solarIcon && !map.hasImage(SOLAR_ICON_ID)) {
              map.addImage(SOLAR_ICON_ID, solarIcon, { pixelRatio: 2 });
            }
          } catch (error) {
            infrastructureSourceReady = false;
            setDegradedMapKey(activeMapKey);
            console.warn("[HoneyCharge infrastructure source]", error);
          }

          if (infrastructureSourceReady) {
            const firstLabelLayer = map
              .getStyle()
              .layers?.find((layer) => layer.type === "symbol")
              ?.id;

            for (const definition of infrastructureLayers) {
              try {
                if (!map.getLayer(definition.layer.id)) {
                  map.addLayer(definition.layer, firstLabelLayer);
                }
              } catch (error) {
                setDegradedMapKey(activeMapKey);
                console.warn(
                  `[HoneyCharge infrastructure layer: ${definition.layer.id}]`,
                  error,
                );
              }
            }

            const tilted =
              map.getPitch() >= TILTED_PITCH_THRESHOLD;
            for (const group of GROUPS) {
              applyGroupVisibility(
                map,
                group.id,
                visibleGroupsRef.current[group.id],
                tilted,
              );
            }
          }
        });

        map.on("pitch", () => {
          const tilted =
            map.getPitch() >= TILTED_PITCH_THRESHOLD;
          if (!disposed) setIsTilted(tilted);
          for (const group of GROUPS) {
            applyGroupVisibility(
              map,
              group.id,
              visibleGroupsRef.current[group.id],
              tilted,
            );
          }
        });

        map.on("mousemove", (event) => {
          const availableLayers = INTERACTIVE_LAYER_IDS.filter(
            (layerId) => map.getLayer(layerId),
          );
          if (availableLayers.length === 0) return;
          const feature = map.queryRenderedFeatures(event.point, {
            layers: availableLayers,
          })[0];
          map.getCanvas().style.cursor = feature ? "pointer" : "";
        });

        map.on("click", (event) => {
          const availableLayers = INTERACTIVE_LAYER_IDS.filter(
            (layerId) => map.getLayer(layerId),
          );
          if (availableLayers.length === 0) return;

          const feature = map.queryRenderedFeatures(event.point, {
            layers: availableLayers,
          })[0];
          if (!feature) return;

          activePopup?.remove();
          const properties = feature.properties as Record<
            string,
            unknown
          >;
          const popupContent = buildFeaturePopup(
            properties,
            feature.sourceLayer ?? feature.layer.id,
            GROUP_BY_LAYER_ID.get(feature.layer.id),
            language,
          );
          activePopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "min(320px, calc(100vw - 48px))",
            offset: 12,
          })
            .setLngLat(event.lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
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
      activePopup?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [language, region]);

  function toggleGroup(group: InfrastructureGroup) {
    setVisibleGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  }

  function togglePitch() {
    const map = mapRef.current;
    if (!map) return;
    const tiltMap =
      map.getPitch() < TILTED_PITCH_THRESHOLD;
    map.easeTo({
      pitch: tiltMap ? 58 : 0,
      bearing: tiltMap ? -12 : 0,
      duration: 850,
    });
  }

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
        <div className="map-status map-error" role="alert">
          {copy.baseError}
        </div>
      )}
      <div
        className="map-layer-card"
        style={{ pointerEvents: "auto" }}
      >
        <span className="map-layer-title">
          <Layers3 size={14} /> {copy.legend}
        </span>
        {GROUPS.map(({ id, iconClass }) => {
          const visible = visibleGroups[id];
          const toggleLabel = `${copy[id]} · ${
            visible ? copy.turnOff : copy.turnOn
          }`;
          return (
            <button
              key={id}
              type="button"
              className={`map-layer-toggle${visible ? "" : " is-hidden"}`}
              aria-pressed={visible}
              aria-label={toggleLabel}
              title={toggleLabel}
              onClick={() => toggleGroup(id)}
            >
              <i className={iconClass} />
              <span>{copy[id]}</span>
            </button>
          );
        })}
        {infrastructureDegraded && (
          <span className="map-layer-warning" role="status">
            ⚠ {copy.layerWarning}
          </span>
        )}
      </div>
      <button
        type="button"
        className={`map-pitch-toggle${isTilted ? " is-tilted" : ""}`}
        aria-pressed={isTilted}
        aria-label={isTilted ? copy.flatView : copy.tiltedView}
        onClick={togglePitch}
      >
        {isTilted ? "2D" : "3D"}
      </button>
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
