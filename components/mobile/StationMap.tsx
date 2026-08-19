"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  DEMO_CHARGING_STATIONS,
  type DemoChargingStation,
} from "@/lib/data/chargingStations";

const BASE_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const JEJU_CENTER: [number, number] = [126.5, 33.42];

const STATUS_COLOR: Record<DemoChargingStation["status"], string> = {
  available: "#27c9b8",
  busy: "#f0a83c",
  offline: "#a3a8ae",
};

function toGeoJson(stations: DemoChargingStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map((station) => ({
      type: "Feature" as const,
      id: station.id,
      geometry: {
        type: "Point" as const,
        coordinates: [station.lng, station.lat],
      },
      properties: { id: station.id, status: station.status },
    })),
  };
}

/**
 * 실제 MapLibre 렌더링을 쓰는 가벼운 충전소 지도입니다. 운영 대시보드의
 * InfrastructureMap(전력망 설비 레이어)과는 다른 목적이라 그 컴포넌트를
 * 재사용하지 않고, 같은 OpenFreeMap 베이스 스타일 위에 시연용 충전소
 * 마커만 얹은 별도의 가벼운 지도를 씁니다.
 */
export function StationMap({
  stations = DEMO_CHARGING_STATIONS,
  selectedId,
  onSelect,
}: {
  stations?: DemoChargingStation[];
  selectedId: string | null;
  onSelect: (station: DemoChargingStation) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    let disposed = false;

    async function createMap() {
      if (!containerRef.current) return;
      const maplibregl = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      // Center on the already-selected station (if one was passed in as an
      // initial prop, e.g. arriving from a station detail screen) instead
      // of always starting at JEJU_CENTER — otherwise a station chosen
      // before this component mounts gets silently reset to the default
      // view, since the map doesn't exist yet when the [selectedId] effect
      // below first runs.
      const initialStation = stations.find(
        (candidate) => candidate.id === selectedIdRef.current,
      );
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: BASE_STYLE_URL,
        center: initialStation
          ? [initialStation.lng, initialStation.lat]
          : JEJU_CENTER,
        zoom: initialStation ? 13 : 10,
        minZoom: 8,
        maxZoom: 15,
        attributionControl: false,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

      map.once("style.load", () => {
        if (disposed) return;
        map.addSource("stations", {
          type: "geojson",
          data: toGeoJson(stations),
        });
        map.addLayer({
          id: "station-halo",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": 13,
            "circle-color": "#fff",
            "circle-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "station-point",
          type: "circle",
          source: "stations",
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              11,
              8,
            ],
            "circle-color": [
              "match",
              ["get", "status"],
              "available",
              STATUS_COLOR.available,
              "busy",
              STATUS_COLOR.busy,
              STATUS_COLOR.offline,
            ],
            "circle-stroke-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#171d27",
              "#fff",
            ],
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              3,
              2,
            ],
          },
        });

        // Mark the station this component mounted with (if any) as
        // selected now that the "stations" source actually exists —
        // matches the initial-center fix above.
        if (selectedIdRef.current) {
          map.setFeatureState(
            { source: "stations", id: selectedIdRef.current },
            { selected: true },
          );
        }

        map.on("mousemove", "station-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "station-point", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "station-point", (event) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id as string | undefined;
          const station = stations.find((candidate) => candidate.id === id);
          if (station) onSelectRef.current(station);
        });
      });
    }

    void createMap();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // stations is a static demo dataset within this session; only
    // (re)create the map once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previousSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("stations")) return;

    if (
      previousSelectedIdRef.current &&
      previousSelectedIdRef.current !== selectedId
    ) {
      map.setFeatureState(
        { source: "stations", id: previousSelectedIdRef.current },
        { selected: false },
      );
    }
    if (selectedId) {
      map.setFeatureState({ source: "stations", id: selectedId }, { selected: true });
    }
    previousSelectedIdRef.current = selectedId;

    if (!selectedId) return;
    const station = stations.find((candidate) => candidate.id === selectedId);
    if (!station) return;
    map.easeTo({ center: [station.lng, station.lat], duration: 500 });
  }, [selectedId, stations]);

  return (
    <div
      ref={containerRef}
      className="station-map"
      role="region"
      aria-label="주변 충전소 지도"
    />
  );
}
