import { Gauge, Route } from "lucide-react";
import type { MobilityPatternViewModel } from "@/lib/services/liveMobilityService";

/**
 * §22–§23: "why HoneyCharge predicts your schedule" card, built entirely
 * from the locally-derived mobilityProfile (median/typical values over the
 * synthetic trip history) — the same summary Gemini would receive, never
 * raw trip records.
 */
export function MobilityPatternCard({ pattern }: { pattern: MobilityPatternViewModel }) {
  if (pattern.historySampleCount === 0) {
    return (
      <section className="hc-pattern-card" aria-label="나의 이동 패턴">
        <strong>나의 이동 패턴</strong>
        <p className="hc-pattern-empty">아직 분석할 주행 이력이 없어요.</p>
      </section>
    );
  }

  return (
    <section className="hc-pattern-card" aria-label="나의 이동 패턴">
      <div className="hc-pattern-head">
        <strong>나의 평일 패턴</strong>
        <span className={`hc-pattern-confidence is-${pattern.confidenceLabel}`}>
          패턴 신뢰도 {pattern.confidenceLabel}
        </span>
      </div>

      <div className="hc-pattern-grid">
        <div>
          <span>일반적인 출발</span>
          <strong>{pattern.typicalDepartureTime ?? "-"}</strong>
        </div>
        <div>
          <span>일반적인 귀가</span>
          <strong>{pattern.typicalReturnTime ?? "-"}</strong>
        </div>
        <div>
          <span>
            <Route size={11} /> 평균 주행거리
          </span>
          <strong>{pattern.medianTripDistanceKm ?? "-"}km</strong>
        </div>
        <div>
          <span>
            <Gauge size={11} /> 평균 전비
          </span>
          <strong>
            {pattern.medianConsumptionKWhPerKm
              ? `${pattern.medianConsumptionKWhPerKm}kWh/km`
              : "-"}
          </strong>
        </div>
      </div>

      <p className="hc-pattern-note">
        최근 {pattern.historySampleCount}건의 주행 기록을 바탕으로 계산했어요
        {pattern.departureStdMinutes !== null &&
          ` (출발 시각 변동폭 ±${Math.round(pattern.departureStdMinutes)}분)`}
        . HoneyCharge는 이 패턴으로 다음 출발을 예측해요.
      </p>
    </section>
  );
}
