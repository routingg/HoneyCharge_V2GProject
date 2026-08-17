"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuditLog } from "@/lib/domain/audit/auditLog";
import type { AuditEvent } from "@/lib/domain/audit/types";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";
import type { SimulationEventType } from "@/lib/domain/vehicle/types";
import {
  computeSnapshot,
  createValidationEngine,
  type EngineSnapshot,
  type GeminiCandidate,
  type ValidationEngine,
} from "@/lib/services/validationEngine";
import { ComparisonPanel } from "./ComparisonPanel";
import { TimelineChart } from "./TimelineChart";

const SEED = 7;
const VEHICLE_CONFIG = {
  vehicleId: "OWN-002",
  batteryCapacityKWh: 99.8,
  maxChargePowerKW: 6.4,
  maxDischargePowerKW: 9,
  hardMinimumSoc: 20,
  preferredReserveSoc: 15,
  initialSoc: 68,
};

const SAFETY_STATE_LABEL: Record<string, string> = {
  NORMAL: "정상",
  CONSERVATIVE: "보수적 운영",
  CHARGE_REQUIRED: "충전 필요",
  VEHICLE_UNAVAILABLE: "차량 이용 불가",
  STALE_DATA: "데이터 지연",
  EMERGENCY_RESERVE: "비상 보호",
};
const SAFETY_STATE_COLOR: Record<string, string> = {
  NORMAL: "var(--green)",
  CONSERVATIVE: "var(--amber)",
  CHARGE_REQUIRED: "var(--amber)",
  VEHICLE_UNAVAILABLE: "var(--muted)",
  STALE_DATA: "#b3413a",
  EMERGENCY_RESERVE: "#b3413a",
};

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}

function buildFreshEngine(): ValidationEngine {
  const startTime = new Date();
  startTime.setSeconds(0, 0);
  return createValidationEngine({ ...VEHICLE_CONFIG, seed: SEED, startTime });
}

function buildFreshAuditLog(): AuditLog {
  const log = new AuditLog();
  log.record("SCENARIO_RESET", { seed: SEED });
  return log;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ScenarioButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2.5 py-1 text-[11px] hover:bg-[var(--green-soft)]"
      style={{ border: "1px solid var(--line)" }}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * §53–§61: the judge/engineer-facing validation dashboard. Every number
 * on this page comes from `computeSnapshot` (which runs the real
 * domain pipeline) or from `/api/validation/backtest` — nothing is
 * hardcoded. The live scenario runs entirely client-side (the domain
 * layer has no server-only dependencies); only the optional Gemini
 * calendar classification goes through a server API route so the API
 * key never reaches the browser (§7).
 */
export function ValidationDashboard() {
  // Created exactly once via useState's lazy initializer (never re-created
  // by a re-render), then held in refs since they're mutable engines the
  // component doesn't need to react to directly — `refresh()` reads them
  // and pushes the result into `snapshot` state instead.
  const [initial] = useState(() => ({ engine: buildFreshEngine(), audit: buildFreshAuditLog() }));
  const engineRef = useRef<ValidationEngine>(initial.engine);
  const auditRef = useRef<AuditLog>(initial.audit);

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<NormalizedCalendarEvent[]>([]);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [geminiCandidates, setGeminiCandidates] = useState<GeminiCandidate[]>([]);
  const [geminiSource, setGeminiSource] = useState<"idle" | "gemini" | "fallback">("idle");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 10 | 60>(10);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => [...initial.audit.all()]);

  const refresh = useCallback(() => {
    const engine = engineRef.current;
    engine.calendarEvents = calendarEvents;
    setSnapshot(computeSnapshot(engine, geminiCandidates, calendarEnabled));
  }, [calendarEvents, geminiCandidates, calendarEnabled]);

  // Only ever called from the "초기화" button's onClick (a user event, not
  // an effect) — replaces the engine/audit log in place and resets the
  // dependent state, which in turn re-triggers `refresh()` below.
  const resetScenario = useCallback(() => {
    engineRef.current = buildFreshEngine();
    auditRef.current = buildFreshAuditLog();
    setCalendarEvents([]);
    setGeminiCandidates([]);
    setGeminiSource("idle");
    setRunning(false);
    setAuditEvents([...auditRef.current.all()]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      engineRef.current?.adapter.tick(speed * 0.5);
      refresh();
    }, 500);
    return () => clearInterval(id);
  }, [running, speed, refresh]);

  // §63: a calendar change re-syncs Gemini classification, which in turn
  // reruns prediction -> guaranteed SOC -> schedule via `refresh()`.
  useEffect(() => {
    const engine = engineRef.current;
    if (!calendarEnabled || calendarEvents.length === 0 || !engine) return;
    let cancelled = false;
    const now = engine.clock.now();
    (async () => {
      const candidates: GeminiCandidate[] = [];
      let sawGemini = false;
      for (const event of calendarEvents) {
        try {
          const res = await fetch("/api/ai/calendar/analyze", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event,
              mobilityProfile: { historySampleCount: engine.tripHistory.length },
              nowIso: now.toISOString(),
            }),
          });
          if (!res.ok) continue;
          const analysis = (await res.json()) as {
            source: "gemini" | "fallback";
            vehicleNeedProbability: number;
            confidence: number;
          };
          if (analysis.source === "gemini") sawGemini = true;
          candidates.push({
            eventId: event.id,
            vehicleNeedProbability: analysis.vehicleNeedProbability,
            confidence: analysis.confidence,
          });
        } catch {
          // Network failure: the domain layer's own calendar heuristic
          // still runs without this candidate (§9).
        }
      }
      if (!cancelled) {
        setGeminiCandidates(candidates);
        setGeminiSource(sawGemini ? "gemini" : "fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [calendarEvents, calendarEnabled]);

  const injectEvent = useCallback(
    (type: SimulationEventType, payload?: Record<string, unknown>) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.adapter.applyEvent({ type, atMinute: 0, payload });
      auditRef.current.record(type, payload ?? {}, snapshot?.safetyState);
      setAuditEvents([...auditRef.current.all()]);
      refresh();
    },
    [refresh, snapshot],
  );

  const handleEarlyDeparture = () => {
    if (!snapshot) return;
    injectEvent("EARLIER_DEPARTURE", {
      tripEnergyKWh: snapshot.tripEnergyPrediction.requiredEnergyKWh,
      durationMinutes: 30,
    });
  };
  const handleEndTrip = () => {
    engineRef.current?.adapter.endDriving();
    auditRef.current.record("TRIP_ENDED", {}, snapshot?.safetyState);
    setAuditEvents([...auditRef.current.all()]);
    refresh();
  };
  const handleCalendarChange = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const start = new Date(engine.clock.now().getTime() + 90 * 60_000);
    const end = new Date(start.getTime() + 60 * 60_000);
    const event: NormalizedCalendarEvent = {
      id: `demo-${start.getTime()}`,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      location: "광주 상무지구",
    };
    setCalendarEvents((prev) => [...prev, event]);
    auditRef.current.record("CALENDAR_CHANGED", { eventId: event.id, start: event.start });
    setAuditEvents([...auditRef.current.all()]);
  };
  const handleLowSoc = () => injectEvent("LOW_SOC", { soc: 22 });
  const handleStaleTelemetry = () => injectEvent("TELEMETRY_STALE", {});
  const handleChargerDisconnect = () => injectEvent("CHARGER_DISCONNECTED", {});
  const handleReconnect = () => {
    engineRef.current?.adapter.reconnect();
    auditRef.current.record("RECONNECTED", {}, snapshot?.safetyState);
    setAuditEvents([...auditRef.current.all()]);
    refresh();
  };

  if (!snapshot) {
    return <p style={{ color: "var(--muted)" }}>시나리오 준비 중…</p>;
  }

  const { vehicleState, departurePrediction, tripEnergyPrediction, guaranteedSocResult, safetyState, schedule } =
    snapshot;
  const currentAction = schedule.slots[0]?.action ?? "IDLE";
  const currentExplanation = schedule.slots[0]?.explanation ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">HoneyCharge 검증 대시보드</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            사용자 이동권을 보호하면서 V2G에 쓸 수 있는 배터리를 얼마나 늘릴 수 있는지 실험하는
            화면이에요. 모든 수치는 실시간 계산 결과이며, 차량/충전기 제어는 소프트웨어 시뮬레이션입니다.
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "var(--green-soft)", color: SAFETY_STATE_COLOR[safetyState] }}
        >
          안전 상태: {SAFETY_STATE_LABEL[safetyState] ?? safetyState}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="현재 차량">
          <Stat label="SOC" value={`${vehicleState.soc}%`} />
          <Stat label="배터리 용량" value={`${vehicleState.batteryCapacityKWh}kWh`} />
          <Stat label="충전기 연결" value={vehicleState.chargerConnected ? "연결됨" : "분리됨"} />
          <Stat label="주행 중" value={vehicleState.driving ? "예" : "아니오"} />
          <Stat label="데이터 지연" value={`${snapshot.telemetryAgeMinutes.toFixed(0)}분`} />
        </Card>

        <Card title="다음 이동 예측">
          <Stat label="예상 출발" value={fmtTime(departurePrediction.predictedDeparture)} />
          <Stat label="예측 신뢰도" value={`${Math.round(departurePrediction.confidence * 100)}%`} />
          <Stat label="예상 주행거리" value={`${tripEnergyPrediction.predictedDistanceKm}km`} />
          <Stat label="예상 필요 에너지" value={`${tripEnergyPrediction.requiredEnergyKWh}kWh`} />
          <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
            {departurePrediction.sourceWeights.historical > 0 && (
              <span className="rounded bg-[var(--green-soft)] px-1.5 py-0.5">이력 {Math.round(departurePrediction.sourceWeights.historical * 100)}%</span>
            )}
            {departurePrediction.sourceWeights.calendar > 0 && (
              <span className="rounded bg-[var(--green-soft)] px-1.5 py-0.5">캘린더 {Math.round(departurePrediction.sourceWeights.calendar * 100)}%</span>
            )}
            {departurePrediction.sourceWeights.gemini > 0 && (
              <span className="rounded bg-[var(--green-soft)] px-1.5 py-0.5">Gemini {Math.round(departurePrediction.sourceWeights.gemini * 100)}%</span>
            )}
          </div>
        </Card>

        <Card title="보장 SOC 구성">
          <Stat label="이동 필요분" value={`${guaranteedSocResult.tripRequirementSoc}%`} />
          <Stat label="사용자 여유분" value={`${guaranteedSocResult.userReserveSoc}%`} />
          <Stat label="예측 불확실성 여유" value={`${guaranteedSocResult.uncertaintyMarginSoc}%`} />
          <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--line)" }}>
            <Stat label="보장 SOC" value={<strong>{guaranteedSocResult.guaranteedSoc}%</strong>} />
          </div>
        </Card>

        <Card title="V2G 가용 배터리">
          <Stat label="현재 SOC" value={`${vehicleState.soc}%`} />
          <Stat label="보장 SOC" value={`${guaranteedSocResult.guaranteedSoc}%`} />
          <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--line)" }}>
            <Stat label="V2G 가용" value={<strong>{snapshot.availableForV2GSoc}%</strong>} />
            <Stat label="V2G 가용(kWh)" value={`${snapshot.availableForV2GKWh}kWh`} />
          </div>
        </Card>
      </div>

      <Card title="지금 이 순간">
        <p className="text-sm">
          현재 동작: <strong>{currentAction}</strong> — {currentExplanation}
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {geminiSource === "gemini"
            ? "Gemini가 일정 해석을 도왔고, 배터리 보호는 HoneyCharge 안전 규칙으로 계산했어요."
            : geminiSource === "fallback"
              ? "Gemini를 사용할 수 없어 결정론적 이력 기반 예측으로 대체했어요(더 큰 안전 여유 적용)."
              : "이력 기반 예측을 사용하고 있어요."}
        </p>
      </Card>

      <Card title="24시간 예상 SOC 타임라인">
        <TimelineChart
          slots={schedule.slots}
          guaranteedSoc={guaranteedSocResult.guaranteedSoc}
          hardMinimumSoc={VEHICLE_CONFIG.hardMinimumSoc}
        />
      </Card>

      <Card title="시나리오 제어 (소프트웨어 시뮬레이션)">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ background: "var(--green)" }}
          >
            {running ? "일시정지" : "시작"}
          </button>
          <button
            type="button"
            onClick={resetScenario}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ border: "1px solid var(--line)" }}
          >
            초기화
          </button>
          <div className="flex items-center gap-1">
            {[1, 10, 60].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s as 1 | 10 | 60)}
                className="rounded-md px-2 py-1 text-xs"
                style={{
                  border: "1px solid var(--line)",
                  background: speed === s ? "var(--green-soft)" : "transparent",
                }}
              >
                {s}×
              </button>
            ))}
          </div>
          <label className="ml-2 flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
            <input
              type="checkbox"
              checked={calendarEnabled}
              onChange={(e) => setCalendarEnabled(e.target.checked)}
            />
            캘린더 신호 사용
          </label>
        </div>

        <p className="mb-1 mt-3 text-xs font-medium" style={{ color: "var(--muted)" }}>
          이벤트 주입
        </p>
        <div className="flex flex-wrap gap-2">
          <ScenarioButton label="출발 시각 앞당김" onClick={handleEarlyDeparture} />
          <ScenarioButton label="귀가(주행 종료)" onClick={handleEndTrip} />
          <ScenarioButton label="일정 변경 추가" onClick={handleCalendarChange} />
          <ScenarioButton label="SOC 급감" onClick={handleLowSoc} />
          <ScenarioButton label="통신 지연(오래된 데이터)" onClick={handleStaleTelemetry} />
          <ScenarioButton label="충전기 분리" onClick={handleChargerDisconnect} />
          <ScenarioButton label="재연결" onClick={handleReconnect} />
        </div>
      </Card>

      <Card title="고정 SOC vs 적응형 SOC 비교 (합성 이력 백테스트)">
        <ComparisonPanel seed={SEED} />
      </Card>

      <Card title="감사 로그">
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
          {[...auditEvents].reverse().map((event, i) => (
            <li key={i} style={{ color: "var(--muted)" }}>
              <span className="tabular-nums">{new Date(event.timestamp).toLocaleTimeString("ko-KR")}</span>{" "}
              — <strong style={{ color: "var(--ink)" }}>{event.trigger}</strong>
              {event.safetyState ? ` (${event.safetyState})` : ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
