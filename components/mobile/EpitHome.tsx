import { Bell, Menu, Zap } from "lucide-react";
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

const badgeLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "충전 중",
  discharging: "공유 중",
  standby: "대기",
  "soc-protected": "보호 중",
  disconnected: "연결 안 됨",
};

const ctaLabel: Record<HomeViewModel["energyState"], string> = {
  charging: "충전 상세보기",
  discharging: "V2G 공유 중",
  standby: "V2G 시작",
  "soc-protected": "배터리 보호 중",
  disconnected: "충전소 찾기",
};

/**
 * "HoneyCharge Charge" — E-pit 홈 화면 재현. 상단 45%는 다크 네이비
 * 차량 영역(로고·탭·차량명·차량·SOC·요약 패널), 하단은 화이트 영역에
 * 담긴 <MobilityHome/>(보장 SOC 히어로·오늘의 플랜·AI 인사이트)로
 * 이어집니다. vm(구 그리드 시뮬레이션)은 리워드 포인트와 CTA 라우팅에만
 * 남아있고, 배터리·출발·V2G 계획은 전부 mvm(실시간 모빌리티 엔진)에서
 * 옵니다.
 */
export function EpitHome({
  vm,
  mvm,
  scheduleChangeDiff,
  onDismissScheduleChange,
  fetchExplanation,
  fetchMobilityInsight,
  onNavigate,
  onOpenSettings,
  onOpenFocus,
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
  onOpenFocus: () => void;
  onOpenCalendar: () => void;
  onOpenNotifications: () => void;
  notificationCount: number;
}) {
  const displayState = deriveDisplayEnergyState(mvm);
  const hasFocusScreen =
    displayState === "charging" ||
    displayState === "discharging" ||
    displayState === "soc-protected";
  const rangeKm = estimateRangeKm({ batteryCapacityKWh: mvm.batteryCapacityKWh }, mvm.currentSoc);

  return (
    <div className="epit-home">
      <div className="epit-dark-zone">
        <div className="epit-header">
          <span className="epit-logo">
            Honey<span>Charge</span>
          </span>
          <div className="epit-header-icons">
            <button type="button" aria-label="알림" onClick={onOpenNotifications} className="hc-bell-btn">
              <Bell size={19} strokeWidth={1.7} />
              {notificationCount > 0 && <span className="hc-bell-dot" />}
            </button>
            <button
              type="button"
              aria-label="화면 스타일 설정"
              onClick={onOpenSettings}
            >
              <Menu size={19} strokeWidth={1.7} />
            </button>
          </div>
        </div>

        <div className="epit-tabs">
          <button
            type="button"
            className="is-active"
            onClick={() => onNavigate("home")}
          >
            홈
          </button>
          <button type="button" onClick={() => onNavigate("stations")}>
            충전소
          </button>
          <button type="button" onClick={() => onNavigate("myVehicle")}>
            마이카
          </button>
        </div>

        <div className="epit-vehicle-name-row">
          <strong>{mvm.vehicleModel}</strong>
          <span className={`epit-v2g-badge is-${displayState}`}>
            V2G · {badgeLabel[displayState]}
          </span>
        </div>

        <div className="epit-vehicle-stage">
          <VehicleGlyph state={displayState} />
        </div>

        <div className="epit-soc-row">
          <Zap size={17} strokeWidth={2} />
          <strong>{Math.round(mvm.currentSoc)}%</strong>
          <span className="epit-soc-range">{rangeKm}km</span>
        </div>

        <div className="epit-summary-panel">
          <button type="button" onClick={() => onNavigate("soc")}>
            <span>보호 SOC</span>
            <strong>{Math.round(mvm.guaranteedSoc)}%</strong>
          </button>
          <div>
            <span>오늘 보상</span>
            <strong className="is-accent">{vm.rewardPoints}P</strong>
          </div>
          <div>
            <span>V2G 가능</span>
            <strong>{Math.round(mvm.availablePercent)}%</strong>
          </div>
        </div>
      </div>

      <div className="epit-light-zone">
        <MobilityHome
          vm={mvm}
          scheduleChangeDiff={scheduleChangeDiff}
          onDismissScheduleChange={onDismissScheduleChange}
          fetchExplanation={fetchExplanation}
          fetchMobilityInsight={fetchMobilityInsight}
          onOpenV2G={() => onNavigate("v2g")}
          onOpenCalendar={onOpenCalendar}
        />

        <div className="epit-chip-row">
          <span className="epit-chip is-solid">주변 HoneyCharge PASS</span>
          <span className="epit-chip">즐겨찾는 충전소</span>
        </div>
      </div>

      <div className="epit-fixed-cta">
        <button
          type="button"
          disabled={displayState === "disconnected"}
          onClick={() =>
            hasFocusScreen ? onOpenFocus() : onNavigate("stations")
          }
        >
          <Zap size={18} strokeWidth={2} /> {ctaLabel[displayState]}
        </button>
      </div>
    </div>
  );
}
