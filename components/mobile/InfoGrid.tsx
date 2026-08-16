import { CalendarClock, Gauge, Leaf, Lock, Sparkles, Zap } from "lucide-react";
import type {
  EnergySignalCopy,
  V2GWindow,
} from "@/lib/services/mobileHomeService";
import type { MobileView } from "@/components/mobile/MobileApp";

const signalIcon: Record<EnergySignalCopy["signal"], typeof Leaf> = {
  surplus: Leaf,
  peak: Zap,
  balanced: Gauge,
};

export function InfoGrid({
  minimumSoc,
  recommendedMinimumSoc,
  v2gWindow,
  rewardPoints,
  signalCopy,
  onNavigate,
}: {
  minimumSoc: number;
  recommendedMinimumSoc: number;
  v2gWindow: V2GWindow | null;
  rewardPoints: number;
  signalCopy: EnergySignalCopy;
  onNavigate: (view: MobileView) => void;
}) {
  const SignalIcon = signalIcon[signalCopy.signal];

  return (
    <section className="info-grid" aria-label="에너지 요약">
      <button
        type="button"
        className="info-tile"
        onClick={() => onNavigate("myVehicle")}
      >
        <span className="info-tile-head">
          <Lock size={15} />
          최소 보장 SOC
        </span>
        <strong>{minimumSoc}%</strong>
        <span className="info-tile-sub">
          자동 추천 {recommendedMinimumSoc}%
        </span>
      </button>

      <button
        type="button"
        className="info-tile"
        onClick={() => onNavigate("v2g")}
      >
        <span className="info-tile-head">
          <CalendarClock size={15} />
          오늘 V2G
        </span>
        {v2gWindow ? (
          <>
            <strong>{v2gWindow.startTime}</strong>
            <span className="info-tile-sub">
              전력 공유 예정 · {v2gWindow.energyKWh} kWh
            </span>
          </>
        ) : (
          <>
            <strong>-</strong>
            <span className="info-tile-sub">예정된 공유 없음</span>
          </>
        )}
      </button>

      <button
        type="button"
        className="info-tile is-reward"
        onClick={() => onNavigate("rewards")}
      >
        <span className="info-tile-head">
          <Sparkles size={15} />
          오늘 예상 보상
        </span>
        <strong>+{rewardPoints} P</strong>
        <span className="info-tile-sub">HoneyPoint</span>
      </button>

      <div className={`info-tile is-signal is-${signalCopy.signal}`}>
        <span className="info-tile-head">
          <SignalIcon size={15} />
          현재 에너지 상태
        </span>
        <strong>{signalCopy.headline}</strong>
        <span className="info-tile-sub">{signalCopy.detail}</span>
      </div>
    </section>
  );
}
