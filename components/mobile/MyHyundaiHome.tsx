import { Bell, CalendarClock, Lock, MapPin, Settings, Zap } from "lucide-react";
import { MobilityHome } from "@/components/mobile/MobilityHome";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { ScheduleChangeDiff } from "@/components/mobile/useLiveMobility";
import type { MobileView } from "@/components/mobile/MobileApp";
import type {
  MobilityContextAnalysis,
  ScheduleExplanation,
} from "@/lib/services/ai/types";
import {
  deriveDisplayEnergyState,
  type MobilityHomeViewModel,
} from "@/lib/services/liveMobilityService";
import { estimateRangeKm, type HomeViewModel } from "@/lib/services/mobileHomeService";

const stateLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "충전 중",
  discharging: "전력 공유 중",
  standby: "대기 중",
  "soc-protected": "최소 배터리 보호 중",
  disconnected: "충전기 연결 안 됨",
};

/**
 * "HoneyCharge My Car" — myHyundai 홈 재현. 차량 식별 영역(글리프·SOC바)은
 * 그대로 두되, 아래 이어지는 <MobilityHome/>이 보장 SOC·오늘의 플랜·AI
 * 인사이트를 담당합니다.
 */
export function MyHyundaiHome({
  vm,
  mvm,
  scheduleChangeDiff,
  onDismissScheduleChange,
  fetchExplanation,
  fetchMobilityInsight,
  onNavigate,
  onOpenSettings,
  onOpenCalendar,
  onOpenNotifications,
  notificationCount,
}: {
  vm: HomeViewModel;
  mvm: MobilityHomeViewModel;
  scheduleChangeDiff: ScheduleChangeDiff | null;
  onDismissScheduleChange: () => void;
  fetchExplanation: () => Promise<ScheduleExplanation | null>;
  fetchMobilityInsight: () => Promise<MobilityContextAnalysis | null>;
  onNavigate: (view: MobileView) => void;
  onOpenSettings: () => void;
  onOpenCalendar: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
}) {
  const displayState = deriveDisplayEnergyState(mvm);
  const socRatio = Math.max(0, Math.min(1, mvm.currentSoc / 100));
  const rangeKm = estimateRangeKm({ batteryCapacityKWh: mvm.batteryCapacityKWh }, mvm.currentSoc);
  const powerLine =
    displayState === "charging"
      ? `충전 중`
      : displayState === "discharging"
        ? `V2G 공유 중`
        : null;

  return (
    <>
      <div className="myh-topbar">
        <span className="myh-brand">HoneyCharge</span>
        <span className="myh-icon-group">
          <button
            type="button"
            className="myh-icon-btn hc-bell-btn"
            aria-label="알림"
            onClick={onOpenNotifications}
          >
            <Bell size={18} />
            {notificationCount > 0 && <span className="hc-bell-dot" />}
          </button>
          <button
            type="button"
            className="myh-icon-btn"
            aria-label="화면 스타일 설정"
            onClick={onOpenSettings}
          >
            <Settings size={18} />
          </button>
        </span>
      </div>

      <h1 className="myh-title">내 {mvm.vehicleModel}</h1>

      <div className="myh-soc-row">
        <div>
          <strong>{Math.round(mvm.currentSoc)}%</strong>
          <span>{rangeKm} km</span>
        </div>
        <div className="myh-soc-bar">
          <i style={{ width: `${socRatio * 100}%` }} />
        </div>
      </div>

      <div className="myh-vehicle-stage">
        <VehicleGlyph state={displayState} />
      </div>
      <div className="myh-stage-dots" aria-hidden="true">
        <span className="is-active" />
        <span />
        <span />
      </div>

      <p className="myh-state-line">
        <span className={`myh-state-dot is-${displayState}`} />
        {displayState === "soc-protected" && (
          <Lock size={13} className="myh-lock-icon" />
        )}
        {stateLabel[displayState]}
        {powerLine && <span className="myh-power">· {powerLine}</span>}
      </p>
      <p className="myh-sub-line">보호 SOC {Math.round(mvm.guaranteedSoc)}%</p>

      <div className="myh-quick-actions">
        <button type="button" onClick={() => onNavigate("v2g")}>
          <span className="myh-quick-icon">
            <Zap size={20} strokeWidth={1.6} />
          </span>
          <span>V2G</span>
        </button>
        <button type="button" onClick={() => onNavigate("soc")}>
          <span className="myh-quick-icon">
            <Lock size={20} strokeWidth={1.6} />
          </span>
          <span>SOC</span>
        </button>
        <button type="button" onClick={onOpenCalendar}>
          <span className="myh-quick-icon">
            <CalendarClock size={20} strokeWidth={1.6} />
          </span>
          <span>캘린더</span>
        </button>
        <button type="button" onClick={() => onNavigate("stations")}>
          <span className="myh-quick-icon">
            <MapPin size={20} strokeWidth={1.6} />
          </span>
          <span>충전소</span>
        </button>
      </div>

      <MobilityHome
        vm={mvm}
        scheduleChangeDiff={scheduleChangeDiff}
        onDismissScheduleChange={onDismissScheduleChange}
        fetchExplanation={fetchExplanation}
        fetchMobilityInsight={fetchMobilityInsight}
        onOpenV2G={() => onNavigate("v2g")}
        onOpenCalendar={onOpenCalendar}
      />

      <button
        type="button"
        className="myh-card"
        onClick={() => onNavigate("rewards")}
      >
        <span className="myh-card-eyebrow">
          <span className="myh-card-icon">
            <Zap size={13} strokeWidth={2} />
          </span>
          오늘의 HoneyCharge
        </span>
        <strong className="myh-card-headline">오늘 예상 보상</strong>
        <span className="myh-card-detail">
          이번 주 참여 내역과 쿠폰은 HoneyWallet에서 확인하세요.
        </span>
        <span className="myh-card-footer">
          <span>
            오늘 예상 보상 <strong>+{vm.rewardPoints} P</strong>
          </span>
        </span>
      </button>
    </>
  );
}
