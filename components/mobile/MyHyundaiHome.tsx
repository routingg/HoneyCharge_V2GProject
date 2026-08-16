import {
  Bell,
  CalendarClock,
  ChevronRight,
  Lock,
  MapPin,
  Zap,
} from "lucide-react";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { MobileView } from "@/components/mobile/MobileApp";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

const stateLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "충전 중",
  discharging: "전력 공유 중",
  standby: "대기 중",
  "soc-protected": "최소 배터리 보호 중",
  disconnected: "충전기 연결 안 됨",
};

/**
 * "HoneyCharge My Car" — myHyundai 홈 재현. 차분한 SOC/주행거리 바(거대
 * 숫자 아님), 화이트 캔버스에 넓은 여백을 둔 큰 차량, 라벨형 퀵액션
 * 4칸, 옅은 그림자의 화이트 카드. E-pit과 정보 밀도·위계가 다릅니다.
 */
export function MyHyundaiHome({
  vm,
  onNavigate,
  onOpenSettings,
}: {
  vm: HomeViewModel;
  onNavigate: (view: MobileView) => void;
  onOpenSettings: () => void;
}) {
  const socRatio = Math.max(0, Math.min(1, vm.soc / 100));
  const powerLine =
    vm.energyState === "charging"
      ? `${vm.powerKw.toFixed(1)} kW`
      : vm.energyState === "discharging"
        ? `-${vm.powerKw.toFixed(1)} kW`
        : null;

  return (
    <>
      <div className="myh-topbar">
        <span className="myh-brand">HoneyCharge</span>
        <button
          type="button"
          className="myh-icon-btn"
          aria-label="화면 스타일 설정"
          onClick={onOpenSettings}
        >
          <Bell size={18} />
        </button>
      </div>

      <h1 className="myh-title">내 {vm.vehicle.model}</h1>

      <div className="myh-soc-row">
        <div>
          <strong>{Math.round(vm.soc)}%</strong>
          <span>{vm.rangeKm} km</span>
        </div>
        <div className="myh-soc-bar">
          <i style={{ width: `${socRatio * 100}%` }} />
        </div>
      </div>

      <div className="myh-vehicle">
        <VehicleGlyph state={vm.energyState} />
      </div>

      <p className="myh-state-line">
        <span className={`myh-state-dot is-${vm.energyState}`} />
        {vm.energyState === "soc-protected" && (
          <Lock size={13} className="myh-lock-icon" />
        )}
        {stateLabel[vm.energyState]}
        {powerLine && <span className="myh-power">· {powerLine}</span>}
      </p>
      <p className="myh-sub-line">최소 보장 SOC {vm.minimumSoc}%</p>

      <div className="myh-quick-actions">
        <button type="button" onClick={() => onNavigate("v2g")}>
          <Zap size={22} strokeWidth={1.6} />
          <span>V2G</span>
        </button>
        <button type="button" onClick={() => onNavigate("myVehicle")}>
          <Lock size={22} strokeWidth={1.6} />
          <span>SOC</span>
        </button>
        <button type="button" onClick={() => onNavigate("v2g")}>
          <CalendarClock size={22} strokeWidth={1.6} />
          <span>스케줄</span>
        </button>
        <button type="button" onClick={() => onNavigate("stations")}>
          <MapPin size={22} strokeWidth={1.6} />
          <span>충전소</span>
        </button>
      </div>

      <button
        type="button"
        className="myh-card"
        onClick={() => onNavigate("rewards")}
      >
        <span className="myh-card-eyebrow">오늘의 HoneyCharge</span>
        <strong className="myh-card-headline">{vm.signalCopy.headline}</strong>
        <span className="myh-card-detail">
          {vm.energyState === "charging" &&
            `${vm.powerKw.toFixed(1)} kW로 ${vm.signalCopy.detail}`}
          {vm.energyState === "discharging" &&
            `여유 전력 -${vm.powerKw.toFixed(1)} kW 공유 중`}
          {vm.energyState !== "charging" &&
            vm.energyState !== "discharging" &&
            (vm.v2gWindow
              ? `오늘 ${vm.v2gWindow.startTime}부터 전력 공유 예정`
              : vm.signalCopy.detail)}
        </span>
        <span className="myh-card-footer">
          <span>
            오늘 예상 보상 <strong>+{vm.rewardPoints} P</strong>
          </span>
          <span className="myh-card-link">
            자세히 보기 <ChevronRight size={14} />
          </span>
        </span>
      </button>
    </>
  );
}
