import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { ScheduleBlock } from "@/lib/services/mobileHomeService";

/** myHyundai 카드 문법(화이트, 넓은 여백, 옅은 그림자)을 쓴 V2G 일정. */
export function MyHyundaiV2GSchedule({
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
    <div className="myhv-screen">
      <h1 className="myhv-title">오늘의 V2G</h1>

      <div className="myhv-summary">
        <div>
          <span>충전량</span>
          <strong>{chargeEnergyKWh.toFixed(1)}kWh</strong>
        </div>
        <div>
          <span>방전량</span>
          <strong>{dischargeEnergyKWh.toFixed(1)}kWh</strong>
        </div>
        <div>
          <span>예상 보상</span>
          <strong>{rewardPoints}P</strong>
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="myhv-empty">오늘 예정된 충전·방전이 없어요.</p>
      ) : (
        <ul className="myh-v2g-list">
          {blocks.map((block, index) => (
            <li key={index}>
              <span className={`myh-v2g-icon is-${block.action}`}>
                {block.action === "charge" ? (
                  <ArrowDownToLine size={17} />
                ) : (
                  <ArrowUpFromLine size={17} />
                )}
              </span>
              <span className="myh-v2g-copy">
                <strong>
                  {block.action === "charge" ? "충전" : "전력 공유"}
                </strong>
                <span>
                  {block.startTime} – {block.endTime} · 평균{" "}
                  {block.avgPowerKw}kW
                </span>
              </span>
              <strong className="myh-v2g-energy">{block.energyKWh}kWh</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
