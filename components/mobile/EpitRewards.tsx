import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { ScheduleBlock, VehicleSchedule } from "@/lib/services/mobileHomeService";
import { estimateBlockPoints, getWeeklyParticipation } from "@/lib/services/mobileHomeService";

/** E-pit의 컴팩트 요약 스트립(스펙 §8)을 리워드 화면으로 확장했습니다. */
export function EpitRewards({
  schedule,
  blocks,
}: {
  schedule: VehicleSchedule;
  blocks: ScheduleBlock[];
}) {
  const week = getWeeklyParticipation(schedule);
  const weekKWh = week.reduce((sum, day) => sum + day.participationKWh, 0);
  const weekPoints = week.reduce((sum, day) => sum + day.rewardPoints, 0);
  const activeDays = week.filter((day) => day.participationKWh > 0).length;

  return (
    <div className="epit-v2g">
      <div className="epit-v2g-summary">
        <div>
          <span>이번 주 참여량</span>
          <strong>{weekKWh.toFixed(1)}kWh</strong>
        </div>
        <div>
          <span>획득 HoneyPoint</span>
          <strong className="is-accent">{weekPoints}P</strong>
        </div>
        <div>
          <span>V2G 참여</span>
          <strong>{activeDays}일</strong>
        </div>
      </div>

      <p className="epit-v2g-heading">오늘 적립 내역</p>

      {blocks.length === 0 ? (
        <p className="epit-v2g-empty">오늘 적립된 내역이 없어요.</p>
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
                {block.action === "charge" ? "충전" : "방전"} 참여
              </span>
              <strong className="is-accent">
                +{estimateBlockPoints(schedule, block)}P
              </strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
