import { Bell, Lock } from "lucide-react";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { VehicleEnergyState } from "@/lib/services/mobileHomeService";
import type { Vehicle } from "@/lib/types";

const stateLabel: Record<VehicleEnergyState, string> = {
  charging: "충전 중",
  discharging: "전력 공유 중",
  standby: "대기 중",
  "soc-protected": "최소 배터리 보호 중",
  disconnected: "충전기 연결 안 됨",
};

export function Hero({
  vehicle,
  soc,
  rangeKm,
  energyState,
  powerKw,
  chargeEta,
}: {
  vehicle: Vehicle;
  soc: number;
  rangeKm: number;
  energyState: VehicleEnergyState;
  powerKw: number;
  chargeEta: string | null;
}) {
  const powerLine =
    energyState === "charging"
      ? `${powerKw.toFixed(1)} kW`
      : energyState === "discharging"
        ? `-${powerKw.toFixed(1)} kW`
        : null;

  return (
    <section className={`hero is-${energyState}`}>
      <div className="hero-topbar">
        <span className="hero-brand">HoneyCharge</span>
        <button type="button" className="hero-bell" aria-label="알림">
          <Bell size={20} />
        </button>
      </div>

      <div className="hero-soc">
        <strong>{Math.round(soc)}%</strong>
        <span className="hero-range">{rangeKm} km</span>
      </div>

      <div className="hero-vehicle">
        <VehicleGlyph state={energyState} />
        <span className="hero-vehicle-name">{vehicle.model}</span>
      </div>

      <div className="hero-status">
        <span className={`hero-status-dot is-${energyState}`} aria-hidden="true" />
        <span className="hero-status-label">
          {energyState === "soc-protected" && (
            <Lock size={14} className="hero-lock-icon" />
          )}
          {stateLabel[energyState]}
        </span>
        {powerLine && <span className="hero-power">{powerLine}</span>}
      </div>

      {energyState === "charging" && chargeEta && (
        <p className="hero-eta">{chargeEta} 충전 완료 예상</p>
      )}
      {energyState === "discharging" && (
        <p className="hero-eta">
          최소 배터리 {vehicle.minimumSoc}%를 남기고 여유 전력만 공유하고
          있어요.
        </p>
      )}
      {energyState === "soc-protected" && (
        <p className="hero-eta">
          곧 출발 예정이에요. 최소 보장 배터리를 지키기 위해 전력 공유를
          중지했습니다.
        </p>
      )}
    </section>
  );
}
