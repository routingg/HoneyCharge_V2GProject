"use client";

import { useEffect, useState } from "react";
import { Navigation2 } from "lucide-react";
import { DEMO_CHARGING_STATIONS, type DemoChargingStation } from "@/lib/data/chargingStations";

const STATUS_LABEL: Record<DemoChargingStation["status"], string> = {
  available: "이용 가능",
  busy: "혼잡",
  offline: "운영 중지",
};

/**
 * §14–§16 flow, step 1: 충전소 목록 → 상세 → "지도에서 크게 보기". The
 * stationId (not just local component state) is what's handed to
 * StationMapScreen, so the selection survives the screen switch — see
 * App2Shell.tsx's openStationOnMap().
 *
 * §9 example: entering this screen is the "내 주변 충전소" feature, so this
 * is where we actually request the location permission (not on the
 * onboarding screen).
 */
export function StationListScreen({
  onOpenMap,
}: {
  onOpenMap: (stationId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setLocationDenied(false),
      () => setLocationDenied(true),
      { timeout: 5000 },
    );
  }, []);

  return (
    <div className="a2-station-list-screen">
      <h1 className="a2-screen-title">충전소</h1>
      {locationDenied && (
        <p className="a2-station-location-note">
          위치 권한이 없어 거리순 대신 기본 목록을 보여드려요.
        </p>
      )}

      <ul className="a2-station-list">
        {DEMO_CHARGING_STATIONS.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={expandedId === station.id ? "a2-station-row is-open" : "a2-station-row"}
              aria-expanded={expandedId === station.id}
              onClick={() => setExpandedId(expandedId === station.id ? null : station.id)}
            >
              <span className={`a2-station-status-dot is-${station.status}`} aria-hidden="true" />
              <span className="a2-station-row-main">
                <strong>{station.name}</strong>
                <span className="a2-station-row-meta">
                  {station.distanceKm}km · {STATUS_LABEL[station.status]} · {station.powerKw}kW
                  {station.isV2G ? " · V2G" : ""}
                </span>
              </span>
              <span className="a2-station-row-count">
                {station.availableCount}/{station.totalCount}
              </span>
            </button>

            {expandedId === station.id && (
              <div className="a2-station-detail">
                <p className="a2-station-detail-meta">
                  이용 가능 {station.availableCount} / {station.totalCount}
                  {station.waitMinutes > 0 && ` · 예상 대기 ${station.waitMinutes}분`}
                </p>
                <button
                  type="button"
                  className="a2-station-detail-cta"
                  onClick={() => onOpenMap(station.id)}
                >
                  <Navigation2 size={15} /> 지도에서 크게 보기
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
