import { MobilityPatternCard } from "@/components/mobile/MobilityPatternCard";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import {
  deriveDisplayEnergyState,
  type MobilityHomeViewModel,
  type MobilityPatternViewModel,
} from "@/lib/services/liveMobilityService";
import { estimateRangeKm, type VehicleEnergyState } from "@/lib/services/mobileHomeService";

const connectionLabel: Record<VehicleEnergyState, string> = {
  charging: "충전 중",
  discharging: "충전 중",
  standby: "연결됨",
  "soc-protected": "연결됨",
  disconnected: "연결 안 됨",
};

const v2gLabel: Record<VehicleEnergyState, string> = {
  charging: "참여 중",
  discharging: "참여 중",
  standby: "대기",
  "soc-protected": "보호 중",
  disconnected: "미참여",
};

/**
 * Vehicle status body shared by both skins (only the surrounding
 * header/wrapper in EpitVehicle.tsx / MyHyundaiVehicle.tsx differs), so
 * "마이카" has the same feature set — battery, connection, V2G, safety
 * reserve, range, next departure, mobility pattern — on both skins.
 * Battery/V2G come from mvm (the live mobility engine); the pattern card
 * comes from the same engine's mobilityProfile.
 */
export function VehicleStatusBody({
  mvm,
  pattern,
}: {
  mvm: MobilityHomeViewModel;
  pattern: MobilityPatternViewModel;
}) {
  const displayState = deriveDisplayEnergyState(mvm);
  const rangeKm = estimateRangeKm({ batteryCapacityKWh: mvm.batteryCapacityKWh }, mvm.currentSoc);

  return (
    <div className="hc-vehicle-status-body">
      <div className="hc-vehicle-status-stage">
        <VehicleGlyph state={displayState} />
      </div>

      <dl className="hc-vehicle-status-rows">
        <div>
          <dt>배터리</dt>
          <dd>{Math.round(mvm.currentSoc)}%</dd>
        </div>
        <div>
          <dt>충전 / 연결</dt>
          <dd>{connectionLabel[displayState]}</dd>
        </div>
        <div>
          <dt>V2G</dt>
          <dd>{v2gLabel[displayState]}</dd>
        </div>
        <div>
          <dt>내 최소 배터리</dt>
          <dd>{mvm.hardMinimumSoc}%</dd>
        </div>
        <div>
          <dt>예상 주행거리</dt>
          <dd>{rangeKm} km</dd>
        </div>
        <div>
          <dt>다음 출발 예상</dt>
          <dd>{mvm.nextDepartureTime}</dd>
        </div>
      </dl>

      <MobilityPatternCard pattern={pattern} />
    </div>
  );
}
