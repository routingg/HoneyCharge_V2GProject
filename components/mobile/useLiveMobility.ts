"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuditLog } from "@/lib/domain/audit/auditLog";
import type { AuditEvent } from "@/lib/domain/audit/types";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";
import {
  buildEarlierDepartureCalendarEvent,
  buildLiveMobilityEngine,
  buildMobilityHomeViewModel,
  buildMobilityPatternViewModel,
  computeSnapshot,
  jumpLiveEngineBy,
  type EngineSnapshot,
  type GeminiCandidate,
  type MobilityHomeViewModel,
  type ValidationEngine,
} from "@/lib/services/liveMobilityService";
import type {
  MobilityContextAnalysis,
  ScheduleExplanation,
} from "@/lib/services/ai/types";

export interface ScheduleChangeDiff {
  beforeDepartureTime: string;
  afterDepartureTime: string;
  beforeGuaranteedSoc: number;
  afterGuaranteedSoc: number;
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}

function buildEngine(): ValidationEngine {
  return buildLiveMobilityEngine(new Date());
}

/**
 * Client-side wiring around the shared mobility-aware engine
 * (lib/services/liveMobilityService.ts, itself a thin view-model layer over
 * lib/services/validationEngine.ts's computeSnapshot). No prediction, SOC,
 * or scheduling math lives in this hook — it only holds the mutable engine
 * instance, re-runs computeSnapshot on demand, and exposes demo controls
 * that mirror the ones already proven in ValidationDashboard.tsx.
 */
export function useLiveMobility() {
  const [initial] = useState(() => ({ engine: buildEngine(), audit: new AuditLog() }));
  const engineRef = useRef<ValidationEngine>(initial.engine);
  const auditRef = useRef<AuditLog>(initial.audit);

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<NormalizedCalendarEvent[]>([]);
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [geminiCandidates, setGeminiCandidates] = useState<GeminiCandidate[]>([]);
  const [geminiSource, setGeminiSource] = useState<"idle" | "gemini" | "fallback">("idle");
  const [notifications, setNotifications] = useState<AuditEvent[]>([]);
  const [scheduleChangeDiff, setScheduleChangeDiff] = useState<ScheduleChangeDiff | null>(null);

  const refresh = useCallback(() => {
    const engine = engineRef.current;
    engine.calendarEvents = calendarEvents;
    setSnapshot(computeSnapshot(engine, geminiCandidates, calendarEnabled));
  }, [calendarEvents, geminiCandidates, calendarEnabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordNotification = useCallback((trigger: string, details: Record<string, unknown>, safetyState?: EngineSnapshot["safetyState"]) => {
    auditRef.current.record(trigger, details, safetyState);
    setNotifications([...auditRef.current.all()]);
  }, []);

  // Gemini classification for any calendar event the demo adds — same
  // pattern as ValidationDashboard: never blocks, never throws to the UI.
  useEffect(() => {
    const engine = engineRef.current;
    if (!calendarEnabled || calendarEvents.length === 0) return;
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
          // Network failure: domain layer's own calendar heuristic still runs.
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

  const jumpBy = useCallback(
    (minutes: number) => {
      jumpLiveEngineBy(engineRef.current, minutes, calendarEnabled, geminiCandidates);
      recordNotification("TIME_ADVANCED", { minutes });
      refresh();
    },
    [calendarEnabled, geminiCandidates, recordNotification, refresh],
  );

  /** The §16/§40 demo: schedule changes -> departure moves earlier -> protected SOC grows. */
  const triggerScheduleChange = useCallback(() => {
    const engine = engineRef.current;
    const before = snapshot ?? computeSnapshot(engine, geminiCandidates, calendarEnabled);
    const event = buildEarlierDepartureCalendarEvent(
      engine,
      before.departurePrediction.predictedDeparture,
    );
    const nextEvents = [...calendarEvents, event];
    engine.calendarEvents = nextEvents;
    const after = computeSnapshot(engine, geminiCandidates, calendarEnabled);

    setCalendarEvents(nextEvents);
    setScheduleChangeDiff({
      beforeDepartureTime: fmtTime(before.departurePrediction.predictedDeparture),
      afterDepartureTime: fmtTime(after.departurePrediction.predictedDeparture),
      beforeGuaranteedSoc: before.guaranteedSocResult.guaranteedSoc,
      afterGuaranteedSoc: after.guaranteedSocResult.guaranteedSoc,
    });
    recordNotification(
      "CALENDAR_CHANGED",
      {
        eventId: event.id,
        beforeDeparture: before.departurePrediction.predictedDeparture,
        afterDeparture: after.departurePrediction.predictedDeparture,
      },
      after.safetyState,
    );
  }, [snapshot, geminiCandidates, calendarEnabled, calendarEvents, recordNotification]);

  const setHardMinimumSoc = useCallback(
    (value: number) => {
      engineRef.current.hardMinimumSoc = value;
      recordNotification("USER_RESERVE_CHANGED", { hardMinimumSoc: value });
      refresh();
    },
    [recordNotification, refresh],
  );

  const setPreferredReserveSoc = useCallback(
    (value: number) => {
      engineRef.current.preferredReserveSoc = value;
      recordNotification("USER_RESERVE_CHANGED", { preferredReserveSoc: value });
      refresh();
    },
    [recordNotification, refresh],
  );

  const [v2gEnabled, setV2gEnabledState] = useState(true);
  const setV2gEnabled = useCallback(
    (value: boolean) => {
      engineRef.current.v2gEnabled = value;
      setV2gEnabledState(value);
      recordNotification("V2G_TOGGLED", { v2gEnabled: value });
      refresh();
    },
    [recordNotification, refresh],
  );

  const reset = useCallback(() => {
    engineRef.current = buildEngine();
    auditRef.current = new AuditLog();
    setCalendarEvents([]);
    setGeminiCandidates([]);
    setGeminiSource("idle");
    setNotifications([]);
    setScheduleChangeDiff(null);
    setV2gEnabledState(true);
  }, []);

  const fetchExplanation = useCallback(async (): Promise<ScheduleExplanation | null> => {
    if (!snapshot) return null;
    const calendarRelevance: "none" | "low" | "medium" | "high" =
      snapshot.departurePrediction.sourceWeights.calendar > 0.4
        ? "high"
        : snapshot.departurePrediction.sourceWeights.calendar > 0.15
          ? "medium"
          : snapshot.departurePrediction.sourceWeights.calendar > 0
            ? "low"
            : "none";
    try {
      const res = await fetch("/api/ai/schedule/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentSoc: snapshot.vehicleState.soc,
          guaranteedSoc: snapshot.guaranteedSocResult.guaranteedSoc,
          tripRequirementSoc: snapshot.guaranteedSocResult.tripRequirementSoc,
          userReserveSoc: snapshot.guaranteedSocResult.userReserveSoc,
          departureTimeIso: snapshot.departurePrediction.predictedDeparture,
          historicalConfidence: snapshot.departurePrediction.confidence,
          calendarRelevance,
          action: snapshot.schedule.slots[0]?.action ?? "IDLE",
        }),
      });
      if (!res.ok) return null;
      return (await res.json()) as ScheduleExplanation;
    } catch {
      return null;
    }
  }, [snapshot]);

  const fetchMobilityInsight = useCallback(async (): Promise<MobilityContextAnalysis | null> => {
    const engine = engineRef.current;
    if (!snapshot) return null;
    try {
      const res = await fetch("/api/ai/mobility/context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nowIso: engine.clock.now().toISOString(),
          mobilityProfile: snapshot.mobilityProfile,
          upcomingEvents: calendarEvents,
        }),
      });
      if (!res.ok) return null;
      return (await res.json()) as MobilityContextAnalysis;
    } catch {
      return null;
    }
  }, [snapshot, calendarEvents]);

  const vm: MobilityHomeViewModel | null = snapshot ? buildMobilityHomeViewModel(snapshot) : null;
  const pattern = snapshot ? buildMobilityPatternViewModel(snapshot) : null;

  return {
    snapshot,
    vm,
    pattern,
    calendarEnabled,
    setCalendarEnabled,
    calendarEvents,
    geminiSource,
    notifications,
    scheduleChangeDiff,
    dismissScheduleChangeDiff: () => setScheduleChangeDiff(null),
    jumpBy,
    triggerScheduleChange,
    setHardMinimumSoc,
    setPreferredReserveSoc,
    v2gEnabled,
    setV2gEnabled,
    reset,
    fetchExplanation,
    fetchMobilityInsight,
  };
}
