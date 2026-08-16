"use client";

import { useMemo, useState } from "react";
import { Navigation, X } from "lucide-react";
import { StationMap } from "@/components/mobile/StationMap";
import { DEMO_CHARGING_STATIONS } from "@/lib/data/chargingStations";

type FilterId = "v2g" | "available" | "fast";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "v2g", label: "V2G" },
  { id: "available", label: "이용 가능" },
  { id: "fast", label: "급속" },
];

/** 같은 지도 코어를 myHyundai 카드 언어(화이트, 블루 CTA)로 감쌉니다. */
export function MyHyundaiStationMap() {
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stations = useMemo(
    () =>
      DEMO_CHARGING_STATIONS.filter((station) => {
        if (activeFilters.has("v2g") && !station.isV2G) return false;
        if (activeFilters.has("available") && station.status !== "available")
          return false;
        if (activeFilters.has("fast") && !station.isFast) return false;
        return true;
      }),
    [activeFilters],
  );
  const selected = DEMO_CHARGING_STATIONS.find((s) => s.id === selectedId);

  const toggleFilter = (id: FilterId) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="myh-map-screen">
      <h1 className="myhv-title myh-map-title">충전소</h1>
      <div className="myh-map-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilters.has(filter.id) ? "is-active" : ""}
            aria-pressed={activeFilters.has(filter.id)}
            onClick={() => toggleFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="myh-map-frame">
        <StationMap
          stations={stations}
          selectedId={selectedId}
          onSelect={(station) => setSelectedId(station.id)}
        />
      </div>

      {selected && (
        <div className="myh-station-sheet">
          <button
            type="button"
            className="myh-sheet-close"
            aria-label="닫기"
            onClick={() => setSelectedId(null)}
          >
            <X size={16} />
          </button>
          <strong className="myh-sheet-name">{selected.name}</strong>
          <p className="myh-sheet-meta">
            {selected.distanceKm}km
            {selected.isV2G ? " · V2G 양방향" : ""}
            {selected.isFast ? " · 초고속" : ""} · {selected.powerKw}kW
          </p>
          <p className="myh-sheet-availability">
            이용 가능 {selected.availableCount} / {selected.totalCount}
            {selected.waitMinutes > 0 && ` · 예상 대기 ${selected.waitMinutes}분`}
          </p>
          <div className="myh-sheet-actions">
            <button type="button" className="myh-sheet-outline">
              <Navigation size={14} /> 내비 전송
            </button>
            <button type="button" className="myh-blue-cta myh-sheet-cta">
              예약하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
