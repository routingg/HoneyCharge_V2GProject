import { Bell, Menu, RefreshCw, Zap } from "lucide-react";
import { VehicleGlyph } from "@/components/mobile/VehicleGlyph";
import type { MobileView } from "@/components/mobile/MobileApp";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

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
 * 차량 영역(로고·탭·차량명·차량·SOC·요약 패널), 하단 55%는
 * 화이트/민트 서비스 영역(민트 카드) + 하단 고정 그라디언트 CTA로
 * 나뉩니다. Hero/InfoGrid의 단일 카드 구조와는 완전히 다른 레이아웃.
 */
export function EpitHome({
  vm,
  onNavigate,
  onOpenSettings,
  onOpenFocus,
}: {
  vm: HomeViewModel;
  onNavigate: (view: MobileView) => void;
  onOpenSettings: () => void;
  onOpenFocus: () => void;
}) {
  const hasFocusScreen =
    vm.energyState === "charging" ||
    vm.energyState === "discharging" ||
    vm.energyState === "soc-protected";
  const availablePercent = Math.max(
    0,
    Math.round(vm.soc - vm.minimumSoc),
  );

  return (
    <div className="epit-home">
      <div className="epit-dark-zone">
        <div className="epit-header">
          <span className="epit-logo">
            Honey<span>Charge</span>
          </span>
          <div className="epit-header-icons">
            <button type="button" aria-label="알림">
              <Bell size={19} strokeWidth={1.7} />
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
          <strong>{vm.vehicle.model}</strong>
          <span className={`epit-v2g-badge is-${vm.energyState}`}>
            V2G · {badgeLabel[vm.energyState]}
          </span>
        </div>

        <div className="epit-vehicle-stage">
          <VehicleGlyph state={vm.energyState} />
        </div>

        <div className="epit-soc-row">
          <Zap size={17} strokeWidth={2} />
          <strong>{Math.round(vm.soc)}%</strong>
          <span className="epit-soc-range">{vm.rangeKm}km</span>
        </div>

        <div className="epit-summary-panel">
          <div>
            <span>최소 SOC</span>
            <strong>{vm.minimumSoc}%</strong>
          </div>
          <div>
            <span>오늘 보상</span>
            <strong className="is-accent">{vm.rewardPoints}P</strong>
          </div>
          <div>
            <span>사용 가능</span>
            <strong>{availablePercent}%</strong>
          </div>
        </div>
      </div>

      <div className="epit-light-zone">
        <div className="epit-mint-card">
          <div className="epit-mint-card-head">
            <span className="epit-mint-badge">HoneyCharge</span>
            <RefreshCw size={15} />
          </div>
          <p>
            {vm.signalCopy.headline}
            <br />
            {vm.signalCopy.detail}
          </p>
          <div className="epit-mint-card-actions">
            <button
              type="button"
              className="epit-btn-outline"
              onClick={() => onNavigate("v2g")}
            >
              V2G 상세
            </button>
            <button
              type="button"
              className="epit-btn-filled"
              onClick={() => onNavigate("myVehicle")}
            >
              스케줄 변경
            </button>
          </div>
        </div>

        <div className="epit-chip-row">
          <span className="epit-chip is-solid">주변 HoneyCharge PASS</span>
          <span className="epit-chip">즐겨찾는 충전소</span>
        </div>
      </div>

      <div className="epit-fixed-cta">
        <button
          type="button"
          disabled={vm.energyState === "disconnected"}
          onClick={() =>
            hasFocusScreen ? onOpenFocus() : onNavigate("stations")
          }
        >
          <Zap size={18} strokeWidth={2} /> {ctaLabel[vm.energyState]}
        </button>
      </div>
    </div>
  );
}
