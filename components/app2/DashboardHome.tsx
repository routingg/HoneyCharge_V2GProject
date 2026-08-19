"use client";

import { useApp2Session } from "@/components/app2/auth/AuthProvider";
import { useLiveMobility } from "@/components/mobile/useLiveMobility";
import { APP2_REWARD_BALANCE_BASE } from "@/lib/data/app2Rewards";
import { estimateRangeKm } from "@/lib/services/mobileHomeService";
import { formatHoney } from "@/lib/services/rewards/formatHoney";

/**
 * §11: the top-of-dashboard safety block. hardMinimumSoc (V2G 최소 보장선)
 * is rendered as a visually distinct boundary on the battery bar, not just
 * another stat — the app must never let SOC silently cross it.
 */
export function DashboardHome({
  onOpenStations,
  onOpenRewards,
}: {
  onOpenStations: () => void;
  onOpenRewards: () => void;
}) {
  const { vehicle } = useApp2Session();
  const live = useLiveMobility();

  if (!live.vm) {
    return <div className="a2-dashboard-loading">불러오는 중...</div>;
  }

  const mvm = live.vm;
  const rangeKm = estimateRangeKm(
    { batteryCapacityKWh: mvm.batteryCapacityKWh },
    mvm.currentSoc,
  );
  const socPercent = Math.round(mvm.currentSoc);
  const minPercent = Math.round(mvm.hardMinimumSoc);
  const usableWidth = Math.max(0, Math.min(100, socPercent - minPercent));
  const vehicleLabel = vehicle ? `내 ${vehicle.model}` : `내 ${mvm.vehicleModel}`;

  return (
    <div className="a2-dashboard">
      <section className="a2-safety-card" aria-label="배터리 및 V2G 안전 정보">
        <p className="a2-safety-vehicle">{vehicleLabel}</p>

        <div className="a2-safety-soc-row">
          <div>
            <strong className="a2-safety-soc-value">{socPercent}%</strong>
            <span className="a2-safety-soc-label">현재 배터리</span>
          </div>
          <div className="a2-safety-range">
            <span className="a2-safety-range-label">주행 가능 거리</span>
            <strong className="a2-safety-range-value">{rangeKm} km</strong>
          </div>
        </div>

        <div className="a2-safety-min-row">
          <span className="a2-safety-min-label">V2G 최소 보장선</span>
          <strong className="a2-safety-min-value">{minPercent}%</strong>
        </div>

        <div
          className="a2-safety-bar"
          role="img"
          aria-label={`현재 배터리 ${socPercent}퍼센트, V2G 최소 보장선 ${minPercent}퍼센트`}
        >
          <div className="a2-safety-bar-track">
            <div className="a2-safety-bar-protected" style={{ width: `${minPercent}%` }} />
            <div
              className="a2-safety-bar-usable"
              style={{ left: `${minPercent}%`, width: `${usableWidth}%` }}
            />
            <div className="a2-safety-bar-minline" style={{ left: `${minPercent}%` }} />
            <div className="a2-safety-bar-marker" style={{ left: `${socPercent}%` }} />
          </div>
          <div className="a2-safety-bar-ticks">
            <span style={{ left: `${minPercent}%` }}>{minPercent}%</span>
            <span style={{ left: `${socPercent}%` }}>{socPercent}%</span>
          </div>
        </div>
      </section>

      <div className="a2-dashboard-quicklinks">
        <button type="button" className="a2-quicklink" onClick={onOpenStations}>
          <span>내 주변 충전소</span>
        </button>
        <button type="button" className="a2-quicklink" onClick={onOpenRewards}>
          <span>보유 리워드</span>
          <strong>{formatHoney(APP2_REWARD_BALANCE_BASE)}</strong>
        </button>
      </div>
    </div>
  );
}
