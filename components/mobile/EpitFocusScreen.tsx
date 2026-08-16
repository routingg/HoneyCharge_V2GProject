import { CheckCircle2, Home, Lock, RefreshCw } from "lucide-react";
import type { HomeViewModel } from "@/lib/services/mobileHomeService";

const DEMO_STATION_NAME = "제주 ICC 충전소";

/**
 * E-pit의 시그니처 충전 화면을 재현합니다: 상단 화이트 영역(제목·위치·
 * 리드 문구) + 하단 민트→시안 그라디언트 영역(거대한 SOC·지표·중단
 * 버튼). 방전은 같은 시각 문법을 재사용하고(스펙 §17), 배터리 보호는
 * 완전히 다른 화이트/체크 레이아웃(스펙 §18)을 씁니다.
 */
export function EpitFocusScreen({
  vm,
  onBack,
}: {
  vm: HomeViewModel;
  onBack: () => void;
}) {
  if (vm.energyState === "charging" || vm.energyState === "discharging") {
    const isDischarging = vm.energyState === "discharging";
    return (
      <section className="epit-focus">
        <div className="epit-focus-topbar">
          <button type="button" aria-label="새로고침">
            <RefreshCw size={19} strokeWidth={1.7} />
          </button>
          <span>{isDischarging ? "전력 공유 중" : "충전 중"}</span>
          <button type="button" aria-label="홈으로" onClick={onBack}>
            <Home size={19} strokeWidth={1.7} />
          </button>
        </div>

        <p className="epit-focus-station">
          HoneyCharge <i /> {isDischarging ? "V2G" : DEMO_STATION_NAME}
        </p>
        <p className="epit-focus-lead">
          {isDischarging ? "전력 공유 중 입니다." : "충전 중 입니다."}
        </p>

        <div className={`epit-focus-gradient ${isDischarging ? "is-discharging" : ""}`}>
          <div className="epit-focus-soc">
            <strong>{Math.round(vm.soc)}</strong>
            <span>%</span>
          </div>

          {!isDischarging && vm.chargeEta && (
            <p className="epit-focus-eta">완료 예상 {vm.chargeEta}</p>
          )}
          {isDischarging && (
            <p className="epit-focus-eta">
              최소 보장 SOC {vm.minimumSoc}%
            </p>
          )}

          <div className="epit-focus-metrics">
            <div>
              <span>{isDischarging ? "오늘 공유량" : "충전량"}</span>
              <strong>{vm.sessionEnergy?.energyKWh ?? 0}kWh</strong>
            </div>
            <i className="epit-focus-divider" />
            <div>
              <span>
                {isDischarging ? "현재 보상" : "예상 HoneyPoint"}
              </span>
              <strong>+{vm.sessionEnergy?.estimatedPoints ?? 0}P</strong>
            </div>
          </div>

          <button type="button" className="epit-focus-stop" onClick={onBack}>
            {isDischarging ? "홈으로" : "충전중단"}
          </button>
        </div>
      </section>
    );
  }

  if (vm.energyState === "soc-protected") {
    return (
      <section className="epit-focus is-protected">
        <p className="epit-protect-complete">
          <CheckCircle2 size={18} /> 전력 공유가 완료되었습니다.
        </p>

        <div className="epit-protect-card">
          <div className="epit-protect-lock">
            <Lock size={22} />
          </div>
          <p className="epit-protect-copy">
            최소 배터리를
            <br />
            안전하게 보호했습니다.
          </p>

          <div className="epit-protect-grid">
            <div>
              <span>보호 후 배터리</span>
              <strong>{Math.round(vm.soc)}%</strong>
            </div>
            <div>
              <span>최소 보장 SOC</span>
              <strong>{vm.minimumSoc}%</strong>
            </div>
            <div>
              <span>획득 HoneyPoint</span>
              <strong className="is-accent">+{vm.rewardPoints}P</strong>
            </div>
          </div>
        </div>

        <button type="button" className="epit-btn-filled epit-protect-btn" onClick={onBack}>
          확인
        </button>
      </section>
    );
  }

  return null;
}
