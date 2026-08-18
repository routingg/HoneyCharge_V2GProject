"use client";

import { useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Calendar,
  ChevronDown,
  Clock,
  Sparkles,
} from "lucide-react";
import type { ScheduleChangeDiff } from "@/components/mobile/useLiveMobility";
import type {
  MobilityContextAnalysis,
  ScheduleExplanation,
} from "@/lib/services/ai/types";
import type {
  MobilityHomeViewModel,
  TimelineBlock,
  TimelineBlockKind,
} from "@/lib/services/liveMobilityService";

const KIND_LABEL: Record<TimelineBlockKind, string> = {
  charge: "충전",
  discharge: "V2G 방전",
  idle: "대기",
  drive: "주행",
};

const ACTION_LABEL: Record<MobilityHomeViewModel["currentAction"], string> = {
  CHARGE: "충전 중",
  DISCHARGE: "V2G 공유 중",
  IDLE: "대기 중",
};

/**
 * §6–§10: the primary mobile home experience. Every number comes from
 * `vm` (built from the real guaranteed-SOC / departure-prediction / V2G
 * scheduler pipeline via lib/services/liveMobilityService.ts) — nothing
 * here is hardcoded. Shared by both E-pit and myHyundai skins; visual
 * identity is applied entirely through `[data-skin]`-scoped CSS on the
 * `hc-*` classes below, so this component is written once.
 */
export function MobilityHome({
  vm,
  scheduleChangeDiff,
  onDismissScheduleChange,
  fetchExplanation,
  fetchMobilityInsight,
  onOpenV2G,
  onOpenCalendar,
}: {
  vm: MobilityHomeViewModel;
  scheduleChangeDiff: ScheduleChangeDiff | null;
  onDismissScheduleChange: () => void;
  fetchExplanation: () => Promise<ScheduleExplanation | null>;
  fetchMobilityInsight: () => Promise<MobilityContextAnalysis | null>;
  onOpenV2G: () => void;
  onOpenCalendar: () => void;
}) {
  const protectedPercent = Math.max(0, Math.min(vm.currentSoc, vm.guaranteedSoc));
  const availablePercent = Math.max(0, vm.currentSoc - vm.guaranteedSoc);
  const previewBlocks = vm.timeline.slice(0, 4);

  return (
    <div className="hc-mobility-home">
      {scheduleChangeDiff && (
        <ScheduleChangeBanner diff={scheduleChangeDiff} onDismiss={onDismissScheduleChange} />
      )}

      <section className="hc-soc-hero" aria-label="배터리 및 출발 준비 상태">
        <p className="hc-soc-hero-eyebrow">
          <Clock size={13} /> 다음 출발 예상 {vm.nextDepartureTime} · 신뢰도{" "}
          {vm.departureConfidencePercent}%
        </p>
        <h2 className="hc-soc-hero-headline">
          {vm.driving
            ? "지금 이동 중이에요"
            : availablePercent > 0
              ? "출발 준비가 되어 있어요"
              : "출발 전 배터리를 채우는 중이에요"}
        </h2>

        <div className="hc-soc-bar" role="img" aria-label={`전체 배터리 ${Math.round(vm.currentSoc)}%, 이동 보호 ${Math.round(protectedPercent)}%, V2G 사용 가능 ${Math.round(availablePercent)}%`}>
          <span
            className="hc-soc-bar-protected"
            style={{ width: `${protectedPercent}%` }}
          />
          <span
            className="hc-soc-bar-available"
            style={{ width: `${availablePercent}%`, left: `${protectedPercent}%` }}
          />
        </div>

        <div className="hc-soc-legend">
          <div>
            <span className="hc-soc-dot is-total" />
            <span>현재 배터리</span>
            <strong>{Math.round(vm.currentSoc)}%</strong>
          </div>
          <div>
            <span className="hc-soc-dot is-protected" />
            <span>다음 이동에 보호</span>
            <strong>{Math.round(protectedPercent)}%</strong>
          </div>
          <div>
            <span className="hc-soc-dot is-available" />
            <span>V2G 사용 가능</span>
            <strong>
              {Math.round(availablePercent)}% · {vm.availableKWh}kWh
            </strong>
          </div>
        </div>

        <ExplanationDisclosure fetchExplanation={fetchExplanation} />
      </section>

      <section className="hc-plan-card" aria-label="오늘의 스마트 에너지 플랜">
        <div className="hc-plan-head">
          <span>
            오늘의 스마트 에너지 플랜 · <strong>{ACTION_LABEL[vm.currentAction]}</strong>
          </span>
          <button type="button" className="hc-plan-link" onClick={onOpenV2G}>
            전체 보기 <ArrowRight size={13} />
          </button>
        </div>
        <ul className="hc-plan-timeline">
          {previewBlocks.map((block, index) => (
            <PlanTimelineRow key={index} block={block} />
          ))}
        </ul>
      </section>

      <AiInsightCard vm={vm} fetchMobilityInsight={fetchMobilityInsight} onOpenCalendar={onOpenCalendar} />
    </div>
  );
}

function PlanTimelineRow({ block }: { block: TimelineBlock }) {
  return (
    <li className={`hc-plan-row is-${block.kind}`}>
      <span className="hc-plan-row-icon" aria-hidden="true">
        {block.kind === "charge" && <BatteryCharging size={15} />}
        {block.kind === "discharge" && <Sparkles size={15} />}
        {block.kind === "drive" && <ArrowRight size={15} />}
        {block.kind === "idle" && <Clock size={15} />}
      </span>
      <span className="hc-plan-row-time">
        {block.startTime}–{block.endTime}
      </span>
      <span className="hc-plan-row-label">{KIND_LABEL[block.kind]}</span>
      {block.kind !== "idle" && block.kind !== "drive" && (
        <strong className="hc-plan-row-energy">{block.energyKWh}kWh</strong>
      )}
    </li>
  );
}

function ExplanationDisclosure({
  fetchExplanation,
}: {
  fetchExplanation: () => Promise<ScheduleExplanation | null>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ScheduleExplanation | null>(null);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !explanation) {
      setLoading(true);
      const result = await fetchExplanation();
      setExplanation(result);
      setLoading(false);
    }
  };

  return (
    <div className="hc-why-disclosure">
      <button type="button" className="hc-why-toggle" onClick={handleToggle} aria-expanded={open}>
        <span>왜 이런 계획인가요?</span>
        <ChevronDown size={15} className={open ? "is-open" : ""} />
      </button>
      {open && (
        <div className="hc-why-body">
          {loading && <p className="hc-why-loading">설명을 준비하고 있어요…</p>}
          {!loading && explanation && (
            <>
              <p className="hc-why-headline">{explanation.headline}</p>
              <p className="hc-why-detail">{explanation.detail}</p>
              <span className="hc-why-source">
                {explanation.source === "gemini" ? "Gemini 설명" : "규칙 기반 설명 (Gemini 미사용)"}
              </span>
            </>
          )}
          {!loading && !explanation && (
            <p className="hc-why-detail">설명을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AiInsightCard({
  vm,
  fetchMobilityInsight,
  onOpenCalendar,
}: {
  vm: MobilityHomeViewModel;
  fetchMobilityInsight: () => Promise<MobilityContextAnalysis | null>;
  onOpenCalendar: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<MobilityContextAnalysis | null>(null);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !insight) {
      setLoading(true);
      const result = await fetchMobilityInsight();
      setInsight(result);
      setLoading(false);
    }
  };

  const sources: { label: string; active: boolean }[] = [
    { label: "최근 주행 이력", active: vm.departureSources.historical > 0 },
    { label: "요일 패턴", active: vm.departureSources.historical > 0 },
    { label: "Google 캘린더", active: vm.departureSources.calendar > 0 },
    { label: "Gemini 상황 분석", active: vm.departureSources.gemini > 0 },
  ];

  return (
    <section className="hc-ai-card" aria-label="AI 모빌리티 인사이트">
      <div className="hc-ai-head">
        <span className="hc-ai-badge">
          <Sparkles size={13} /> AI Mobility Insight
        </span>
        <span className="hc-ai-confidence">신뢰도 {vm.departureConfidencePercent}%</span>
      </div>
      <p className="hc-ai-departure">
        예상 출발 <strong>{vm.nextDepartureTime}</strong>
      </p>
      <ul className="hc-ai-source-list">
        {sources.map((source) => (
          <li key={source.label} className={source.active ? "is-active" : ""}>
            {source.label}
          </li>
        ))}
      </ul>

      <button type="button" className="hc-ai-detail-toggle" onClick={handleExpand} aria-expanded={expanded}>
        <span>자세히 보기</span>
        <ChevronDown size={14} className={expanded ? "is-open" : ""} />
      </button>

      {expanded && (
        <div className="hc-ai-detail-body">
          {loading && <p className="hc-why-loading">분석 중이에요…</p>}
          {!loading && insight && (
            <>
              <p className="hc-ai-detail-line">
                차량 필요 확률 <strong>{Math.round(insight.vehicleNeedProbability * 100)}%</strong>
              </p>
              <ul className="hc-ai-notes">
                {insight.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
              <span className="hc-why-source">
                {insight.source === "gemini" ? "Gemini 분석" : "규칙 기반 분석 (Gemini 미사용)"}
              </span>
            </>
          )}
          {!loading && !insight && (
            <p className="hc-why-detail">분석을 불러오지 못했어요.</p>
          )}
          <button type="button" className="hc-ai-calendar-link" onClick={onOpenCalendar}>
            <Calendar size={13} /> 캘린더 연동 관리
          </button>
        </div>
      )}
    </section>
  );
}

function ScheduleChangeBanner({
  diff,
  onDismiss,
}: {
  diff: ScheduleChangeDiff;
  onDismiss: () => void;
}) {
  return (
    <div className="hc-schedule-change-banner" role="status">
      <p className="hc-schedule-change-title">일정이 변경됐어요</p>
      <div className="hc-schedule-change-rows">
        <div>
          <span>예상 출발</span>
          <strong>
            {diff.beforeDepartureTime} → {diff.afterDepartureTime}
          </strong>
        </div>
        <div>
          <span>보호 배터리</span>
          <strong>
            {diff.beforeGuaranteedSoc}% → {diff.afterGuaranteedSoc}%
          </strong>
        </div>
      </div>
      <p className="hc-schedule-change-note">
        HoneyCharge가 V2G 계획을 자동으로 조정했어요.
      </p>
      <button type="button" className="hc-schedule-change-dismiss" onClick={onDismiss}>
        확인
      </button>
    </div>
  );
}
