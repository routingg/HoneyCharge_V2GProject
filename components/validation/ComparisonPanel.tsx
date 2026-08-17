"use client";

import { useEffect, useState } from "react";
import type { ValidationMetrics } from "@/lib/domain/validation/types";

interface BacktestResponse {
  days: unknown[];
  fixedMetrics: ValidationMetrics;
  adaptiveMetrics: ValidationMetrics;
}

function MetricRow({
  label,
  fixed,
  adaptive,
  unit,
  higherIsBetter,
}: {
  label: string;
  fixed: number;
  adaptive: number;
  unit: string;
  higherIsBetter: boolean;
}) {
  const adaptiveWins = higherIsBetter ? adaptive > fixed : adaptive < fixed;
  const tie = Math.abs(adaptive - fixed) < 0.05;
  return (
    <tr style={{ borderTop: "1px solid var(--line)" }}>
      <td className="py-2 pr-3 text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </td>
      <td className="py-2 pr-3 text-right text-sm tabular-nums">
        {fixed}
        {unit}
      </td>
      <td
        className="py-2 text-right text-sm font-medium tabular-nums"
        style={{ color: tie ? "var(--ink)" : adaptiveWins ? "var(--green)" : "#b3413a" }}
      >
        {adaptive}
        {unit}
      </td>
    </tr>
  );
}

/**
 * §45–§51: fetches the server-computed fixed-vs-adaptive backtest
 * (`/api/validation/backtest`, backed by `runFixedVsAdaptiveBacktest` over
 * synthetic trip history) and renders it. Every number is real output
 * from that endpoint — nothing here is hardcoded, and the panel does not
 * assume the adaptive strategy wins.
 */
export function ComparisonPanel({ seed }: { seed: number }) {
  // A single discriminated-union state, set exactly once per outcome from
  // inside the fetch's own callbacks (never synchronously at the top of
  // the effect body) so a fresh request never causes a redundant render.
  const [result, setResult] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "success"; data: BacktestResponse }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/validation/backtest?seed=${seed}`)
      .then((res) => {
        if (!res.ok) throw new Error(`backtest request failed: ${res.status}`);
        return res.json() as Promise<BacktestResponse>;
      })
      .then((json) => {
        if (!cancelled) setResult({ status: "success", data: json });
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ status: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [seed]);

  if (result.status === "loading") {
    return <p className="text-sm" style={{ color: "var(--muted)" }}>백테스트 실행 중…</p>;
  }
  if (result.status === "error") {
    return (
      <p className="text-sm" style={{ color: "#b3413a" }}>
        비교 데이터를 불러오지 못했어요: {result.message}
      </p>
    );
  }

  const { fixedMetrics, adaptiveMetrics, days } = result.data;

  return (
    <div>
      <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
        30일 합성 이동 이력 중 {days.length}건의 실제(합성) 출발을 사전 이력만으로 예측하고, 동일한
        입력으로 고정 SOC 전략과 적응형 SOC 전략을 각각 실행해 비교했어요 (seed={seed}).
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="pb-1 text-left text-xs font-medium" style={{ color: "var(--muted)" }}>
              지표
            </th>
            <th className="pb-1 text-right text-xs font-medium" style={{ color: "var(--muted)" }}>
              고정 SOC
            </th>
            <th className="pb-1 text-right text-xs font-medium" style={{ color: "var(--muted)" }}>
              적응형 SOC
            </th>
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label="이동권 보장률"
            fixed={fixedMetrics.mobilityGuaranteeRatePercent}
            adaptive={adaptiveMetrics.mobilityGuaranteeRatePercent}
            unit="%"
            higherIsBetter
          />
          <MetricRow
            label="총 방전(V2G) 에너지"
            fixed={fixedMetrics.totalDischargedKWh}
            adaptive={adaptiveMetrics.totalDischargedKWh}
            unit="kWh"
            higherIsBetter
          />
          <MetricRow
            label="총 충전 에너지"
            fixed={fixedMetrics.totalChargedKWh}
            adaptive={adaptiveMetrics.totalChargedKWh}
            unit="kWh"
            higherIsBetter={false}
          />
          <MetricRow
            label="안전 위반 건수"
            fixed={fixedMetrics.safetyViolations}
            adaptive={adaptiveMetrics.safetyViolations}
            unit="건"
            higherIsBetter={false}
          />
        </tbody>
      </table>
      <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
        SOC 예측 오차(MAE)는 적응형 전략에서만 의미가 있어요(고정 전략은 이동 필요량을 예측하지
        않고 고정값을 쓰기 때문). 적응형: {adaptiveMetrics.socPredictionMAE}%p.
      </p>
      {adaptiveMetrics.adaptiveImprovementPercent !== null && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          동일 조건 대비 V2G 방전 에너지 변화: {adaptiveMetrics.adaptiveImprovementPercent > 0 ? "+" : ""}
          {adaptiveMetrics.adaptiveImprovementPercent}%
        </p>
      )}
    </div>
  );
}
