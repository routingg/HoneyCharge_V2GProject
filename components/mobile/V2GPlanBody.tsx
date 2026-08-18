"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Car, Clock } from "lucide-react";
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

const SAFETY_STATE_LABEL: Record<string, string> = {
  NORMAL: "정상",
  CONSERVATIVE: "보수적 운영",
  CHARGE_REQUIRED: "충전 필요",
  VEHICLE_UNAVAILABLE: "차량 이용 중",
  STALE_DATA: "데이터 지연",
  EMERGENCY_RESERVE: "비상 보호",
};

const MIN_RESERVE = 10;
const MAX_RESERVE = 60;

/**
 * §17–§20: the mobile V2G screen's body. Shared by both skins (only the
 * surrounding header/title chrome differs — see EpitV2GSchedule.tsx /
 * MyHyundaiV2GSchedule.tsx) so the 24h timeline and safety-reserve control
 * are written once. Every number comes from `vm`
 * (lib/services/liveMobilityService.ts, itself shaped from
 * computeSnapshot()) — nothing here is a second calculation.
 */
export function V2GPlanBody({
  vm,
  v2gEnabled,
  onToggleV2g,
  onChangeHardMinimumSoc,
}: {
  vm: MobilityHomeViewModel;
  v2gEnabled: boolean;
  onToggleV2g: (enabled: boolean) => void;
  onChangeHardMinimumSoc: (value: number) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const totalMinutes = vm.timeline.reduce((sum, b) => sum + b.durationMinutes, 0) || 1;
  const selected = selectedIndex !== null ? vm.timeline[selectedIndex] : null;

  return (
    <div className="hc-v2g-body">
      <section className="hc-v2g-status-card" aria-label="V2G 현재 상태">
        <div className="hc-v2g-status-row">
          <span className={`hc-v2g-status-badge is-${vm.currentAction.toLowerCase()}`}>
            {vm.currentAction === "DISCHARGE"
              ? "V2G Active"
              : vm.driving
                ? "차량 이용 중"
                : "출발 준비 중"}
          </span>
          <span className="hc-v2g-safety-badge">
            안전 상태 {SAFETY_STATE_LABEL[vm.safetyState] ?? vm.safetyState}
          </span>
        </div>
        <p className="hc-v2g-status-explanation">{vm.currentExplanation}</p>

        <div className="hc-v2g-stats-grid">
          <div>
            <span>현재 SOC</span>
            <strong>{Math.round(vm.currentSoc)}%</strong>
          </div>
          <div>
            <span>보장 SOC</span>
            <strong>{Math.round(vm.guaranteedSoc)}%</strong>
          </div>
          <div>
            <span>V2G 가용</span>
            <strong>
              {Math.round(vm.availablePercent)}% · {vm.availableKWh}kWh
            </strong>
          </div>
        </div>
        <div className="hc-v2g-stats-grid">
          <div>
            <span>오늘 충전</span>
            <strong>{vm.totalChargedKWh}kWh</strong>
          </div>
          <div>
            <span>오늘 방전</span>
            <strong>{vm.totalDischargedKWh}kWh</strong>
          </div>
          <div>
            <span>출발 준비</span>
            <strong>{vm.feasible ? "가능" : "부족"}</strong>
          </div>
        </div>
      </section>

      <section className="hc-v2g-toggle-card" aria-label="자동 V2G 설정">
        <div>
          <strong>자동 V2G</strong>
          <span>여유 배터리를 자동으로 전력망과 공유해요.</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={v2gEnabled}
          className={`hc-toggle-switch ${v2gEnabled ? "is-on" : ""}`}
          onClick={() => onToggleV2g(!v2gEnabled)}
        >
          <span />
        </button>
      </section>

      <section className="hc-v2g-timeline-card" aria-label="24시간 스케줄">
        <p className="hc-v2g-timeline-title">오늘 24시간</p>
        <div className="hc-v2g-timeline-strip" role="list">
          {vm.timeline.map((block, index) => (
            <button
              key={index}
              type="button"
              role="listitem"
              className={`hc-v2g-timeline-seg is-${block.kind} ${selectedIndex === index ? "is-selected" : ""}`}
              style={{ flexGrow: block.durationMinutes / totalMinutes }}
              onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
              aria-label={`${block.startTime}~${block.endTime} ${KIND_LABEL[block.kind]}`}
            />
          ))}
        </div>
        <div className="hc-v2g-timeline-axis">
          <span>{vm.timeline[0]?.startTime ?? "00:00"}</span>
          <span>24시간 후</span>
        </div>
        <div className="hc-v2g-timeline-legend">
          {(["charge", "discharge", "idle", "drive"] as TimelineBlockKind[]).map((kind) => (
            <span key={kind} className={`is-${kind}`}>
              <i /> {KIND_LABEL[kind]}
            </span>
          ))}
        </div>

        {selected && <TimelineDetail block={selected} />}
      </section>

      <section className="hc-v2g-reserve-card" aria-label="배터리 보호 설정">
        <strong>배터리 보호</strong>
        <p className="hc-v2g-reserve-hint">
          자동 보호 SOC <strong>{Math.round(vm.guaranteedSoc)}%</strong>는 이동 필요분(
          {Math.round(vm.tripRequirementSoc)}%) + 여유분({Math.round(vm.userReserveSoc)}%) +
          예측 불확실성 여유({Math.round(vm.uncertaintyMarginSoc)}%)로 계산돼요.
        </p>
        <div className="hc-v2g-reserve-row">
          <span>내가 원하는 최소 배터리</span>
          <strong>{vm.hardMinimumSoc}%</strong>
        </div>
        <input
          type="range"
          min={MIN_RESERVE}
          max={MAX_RESERVE}
          value={vm.hardMinimumSoc}
          onChange={(event) => onChangeHardMinimumSoc(Number(event.target.value))}
          className="hc-v2g-reserve-slider"
          style={{
            ["--fill" as string]: `${((vm.hardMinimumSoc - MIN_RESERVE) / (MAX_RESERVE - MIN_RESERVE)) * 100}%`,
          }}
          aria-label="내가 원하는 최소 배터리"
        />
        <p className="hc-v2g-reserve-note">
          이 값은 자동 계산을 절대 넘어서지 않는 하한선이에요 — HoneyCharge가 이보다 낮게
          내려가도록 방전하지 않아요.
        </p>
      </section>
    </div>
  );
}

function TimelineDetail({ block }: { block: TimelineBlock }) {
  return (
    <div className="hc-v2g-detail">
      <div className="hc-v2g-detail-head">
        <span className="hc-v2g-detail-icon">
          {block.kind === "charge" && <ArrowDownToLine size={15} />}
          {block.kind === "discharge" && <ArrowUpFromLine size={15} />}
          {block.kind === "drive" && <Car size={15} />}
          {block.kind === "idle" && <Clock size={15} />}
        </span>
        <strong>
          {block.startTime}–{block.endTime} · {KIND_LABEL[block.kind]}
        </strong>
      </div>
      {block.kind !== "idle" && block.kind !== "drive" && (
        <p className="hc-v2g-detail-energy">
          에너지 <strong>{block.energyKWh}kWh</strong> · 평균 {block.avgPowerKW}kW
        </p>
      )}
      <p className="hc-v2g-detail-reason">{block.explanation}</p>
      <p className="hc-v2g-detail-soc">
        예상 SOC {block.socStart}% → {block.socEnd}%
      </p>
    </div>
  );
}
