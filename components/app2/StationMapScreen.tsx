"use client";

import { useState } from "react";
import { ChevronLeft, Navigation, X } from "lucide-react";
import { NavigationAppSheet } from "@/components/app2/NavigationAppSheet";
import { StationMap } from "@/components/mobile/StationMap";
import { DEMO_CHARGING_STATIONS, type DemoChargingStation } from "@/lib/data/chargingStations";

/**
 * §14–§16 flow, step 2. `initialStationId` comes from StationListScreen via
 * App2Shell — it's what the "지도에서 크게 보기" bug (§14) was about: the
 * map needs to open with the station already centered/selected, not reset
 * to the default view. The actual centering-on-load fix lives in
 * components/mobile/StationMap.tsx (shared with /mobile), since the race
 * was in that component regardless of who mounts it.
 *
 * `initialStationId` is only ever read as the initial value: App2Shell
 * mounts this screen fresh every time it navigates to "map" (it's behind a
 * `view === "map" &&` conditional), so there's no later prop change to
 * resync from — no effect needed here.
 */
export function StationMapScreen({
  initialStationId,
  onBack,
}: {
  initialStationId: string | null;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialStationId);
  const [showNavPicker, setShowNavPicker] = useState(false);

  const selected: DemoChargingStation | undefined = DEMO_CHARGING_STATIONS.find(
    (station) => station.id === selectedId,
  );

  return (
    <div className="a2-map-screen">
      <div className="a2-map-topbar">
        <button type="button" className="a2-map-back" onClick={onBack}>
          <ChevronLeft size={18} /> 충전소 목록
        </button>
      </div>

      <div className="a2-map-frame">
        <StationMap selectedId={selectedId} onSelect={(station) => setSelectedId(station.id)} />
      </div>

      {selected && (
        <div className="a2-station-sheet">
          <button
            type="button"
            className="a2-sheet-close"
            aria-label="닫기"
            onClick={() => setSelectedId(null)}
          >
            <X size={16} />
          </button>
          <strong className="a2-sheet-name">{selected.name}</strong>
          <p className="a2-sheet-meta">
            {selected.distanceKm}km
            {selected.isV2G ? " · V2G 양방향" : ""}
            {selected.isFast ? " · 초고속" : ""} · {selected.powerKw}kW
          </p>
          <p className="a2-sheet-availability">
            이용 가능 {selected.availableCount} / {selected.totalCount}
            {selected.waitMinutes > 0 && ` · 예상 대기 ${selected.waitMinutes}분`}
          </p>
          <button type="button" className="a2-sheet-nav-btn" onClick={() => setShowNavPicker(true)}>
            <Navigation size={15} /> 길찾기
          </button>
        </div>
      )}

      {showNavPicker && selected && (
        <NavigationAppSheet
          destination={{ name: selected.name, latitude: selected.lat, longitude: selected.lng }}
          onClose={() => setShowNavPicker(false)}
        />
      )}
    </div>
  );
}
