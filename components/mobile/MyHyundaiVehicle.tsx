import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

const connectionLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "충전 중",
  discharging: "충전 중",
  standby: "연결됨",
  "soc-protected": "연결됨",
  disconnected: "연결 안 됨",
};

const v2gLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "참여 중",
  discharging: "참여 중",
  standby: "대기",
  "soc-protected": "보호 중",
  disconnected: "미참여",
};

/**
 * myHyundai의 차량-제어 화면 문법을 재현합니다: 위에서 본 차량,
 * 넉넉한 여백, 아래로 늘어선 상태 행들. 충전 키오스크가 아니라
 * "내 차 상태를 확인하는" 화면처럼 보이는 것이 목표(스펙 §37).
 */
export function MyHyundaiVehicle({ vm }: { vm: HomeViewModel }) {
  return (
    <section className="myhv-screen">
      <h1 className="myhv-title">차량 상태</h1>

      <div className="myhv-stage">
        <VehicleGlyph state={vm.energyState} />
      </div>

      <dl className="myhv-rows">
        <div>
          <dt>배터리</dt>
          <dd>{Math.round(vm.soc)}%</dd>
        </div>
        <div>
          <dt>충전 / 연결</dt>
          <dd>{connectionLabel[vm.energyState]}</dd>
        </div>
        <div>
          <dt>V2G</dt>
          <dd>{v2gLabel[vm.energyState]}</dd>
        </div>
        <div>
          <dt>최소 SOC</dt>
          <dd>{vm.minimumSoc}%</dd>
        </div>
        <div>
          <dt>예상 주행거리</dt>
          <dd>{vm.rangeKm} km</dd>
        </div>
        <div>
          <dt>출발 예정</dt>
          <dd>{vm.vehicle.departureTime.slice(11, 16)}</dd>
        </div>
      </dl>
    </section>
  );
}
