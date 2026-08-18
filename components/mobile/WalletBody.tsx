"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { DEMO_COUPONS, DEMO_WALLET_BASE_POINTS } from "@/lib/data/coupons";
import {
  getWeeklyParticipation,
  type VehicleSchedule,
} from "@/lib/services/mobileHomeService";

type InsightMetric = "participation" | "reward";

/**
 * HoneyWallet + Energy Insight body, shared by both skins (only the
 * surrounding header/wrapper in EpitRewards.tsx / MyHyundaiWallet.tsx
 * differs) so Rewards has the same feature set — balance, coupons, weekly
 * participation/reward chart — everywhere, not just on myHyundai.
 */
export function WalletBody({ schedule }: { schedule: VehicleSchedule }) {
  const [metric, setMetric] = useState<InsightMetric>("participation");
  const week = getWeeklyParticipation(schedule);
  const maxValue = Math.max(
    ...week.map((day) =>
      metric === "participation" ? day.participationKWh : day.rewardPoints,
    ),
    1,
  );
  const balance = DEMO_WALLET_BASE_POINTS + schedule.rewardPoints;
  const availableCoupons = DEMO_COUPONS.filter((coupon) => !coupon.used);

  return (
    <div className="hc-wallet-body">
      <div className="hc-wallet-balance">
        <span>보유 HoneyPoint</span>
        <strong>{balance.toLocaleString("ko-KR")} P</strong>
      </div>

      <div className="hc-wallet-actions">
        <button type="button">포인트 내역</button>
        <button type="button">쿠폰 교환</button>
        <button type="button">내 쿠폰 · {availableCoupons.length}장</button>
      </div>

      <p className="hc-wallet-section-title">내 쿠폰</p>
      <ul className="hc-coupon-list">
        {DEMO_COUPONS.map((coupon) => (
          <li key={coupon.id} className={coupon.used ? "is-used" : ""}>
            <span className="hc-coupon-qr">
              <QrCode size={26} strokeWidth={1.4} />
            </span>
            <span className="hc-coupon-copy">
              <strong>{coupon.merchant}</strong>
              <span>{coupon.item}</span>
              <span className="hc-coupon-cost">
                {coupon.pointCost.toLocaleString("ko-KR")} HoneyPoint
              </span>
            </span>
            <span className="hc-coupon-badge">
              {coupon.used ? "사용 완료" : "사용 전"}
            </span>
          </li>
        ))}
      </ul>

      <p className="hc-wallet-section-title">Energy Insight</p>
      <div className="hc-insight-switcher">
        <button
          type="button"
          className={metric === "participation" ? "is-active" : ""}
          onClick={() => setMetric("participation")}
        >
          참여량
        </button>
        <button
          type="button"
          className={metric === "reward" ? "is-active" : ""}
          onClick={() => setMetric("reward")}
        >
          보상
        </button>
      </div>

      <div className="hc-insight-chart">
        {week.map((day) => {
          const value =
            metric === "participation" ? day.participationKWh : day.rewardPoints;
          const heightPercent = Math.max(6, (value / maxValue) * 100);
          return (
            <div key={day.label} className="hc-insight-bar">
              <span className="hc-insight-bar-fill" style={{ height: `${heightPercent}%` }} />
              <small>{day.label}</small>
            </div>
          );
        })}
      </div>
      <p className="hc-wallet-empty">
        이번 주 참여를 요일별 패턴으로 보여주는 시연용 그래프예요.
      </p>
    </div>
  );
}
