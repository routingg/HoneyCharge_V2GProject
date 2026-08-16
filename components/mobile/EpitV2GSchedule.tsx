import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { ScheduleBlock } from "@/lib/services/mobileHomeService";

/** E-pit 카드 문법(다크 요약 + 화이트 리스트)을 재사용한 오늘의 V2G 일정. */
export function EpitV2GSchedule({
  blocks,
  chargeEnergyKWh,
  dischargeEnergyKWh,
  rewardPoints,
}: {
  blocks: ScheduleBlock[];
  chargeEnergyKWh: number;
  dischargeEnergyKWh: number;
  rewardPoints: number;
}) {
  return (
    <div className="epit-v2g">
      <div className="epit-v2g-summary">
        <div>
          <span>오늘 충전</span>
          <strong>{chargeEnergyKWh.toFixed(1)}kWh</strong>
        </div>
        <div>
          <span>오늘 방전</span>
          <strong>{dischargeEnergyKWh.toFixed(1)}kWh</strong>
        </div>
        <div>
          <span>오늘 보상</span>
          <strong className="is-accent">{rewardPoints}P</strong>
        </div>
      </div>

      <p className="epit-v2g-heading">오늘 스케줄</p>

      {blocks.length === 0 ? (
        <p className="epit-v2g-empty">오늘 예정된 충전·방전이 없어요.</p>
      ) : (
        <ul className="epit-v2g-list">
          {blocks.map((block, index) => (
            <li key={index} className={`is-${block.action}`}>
              <span className="epit-v2g-icon">
                {block.action === "charge" ? (
                  <ArrowDownToLine size={16} />
                ) : (
                  <ArrowUpFromLine size={16} />
                )}
              </span>
              <span className="epit-v2g-time">
                {block.startTime} – {block.endTime}
              </span>
              <span className="epit-v2g-label">
                {block.action === "charge" ? "충전" : "방전"} · 평균{" "}
                {block.avgPowerKw}kW
              </span>
              <strong>{block.energyKWh}kWh</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
