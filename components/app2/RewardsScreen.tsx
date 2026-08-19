"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import {
  APP2_EXCHANGE_ITEMS,
  APP2_REWARD_BALANCE_BASE,
  APP2_REWARD_HISTORY,
  type HoneyExchangeItem,
} from "@/lib/data/app2Rewards";
import { formatHoney, formatHoneySigned } from "@/lib/services/rewards/formatHoney";

/** §19–§22: every reward figure on this screen renders through formatHoney(). */
export function RewardsScreen() {
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [confirmItem, setConfirmItem] = useState<HoneyExchangeItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const spent = Array.from(redeemed).reduce((sum, id) => {
    const item = APP2_EXCHANGE_ITEMS.find((candidate) => candidate.id === id);
    return sum + (item ? item.cost : 0);
  }, 0);
  const balance = APP2_REWARD_BALANCE_BASE - spent;

  function confirmExchange() {
    if (!confirmItem) return;
    setRedeemed((current) => new Set(current).add(confirmItem.id));
    setSuccessMessage(
      confirmItem.kind === "charging-discount"
        ? `${confirmItem.item}이 적용되었습니다.`
        : `${confirmItem.item} 교환이 완료되었습니다.`,
    );
    setConfirmItem(null);
  }

  return (
    <div className="a2-rewards-screen">
      <h1 className="a2-screen-title">리워드</h1>

      <div className="a2-reward-balance">
        <span>보유</span>
        <strong>{formatHoney(balance)}</strong>
      </div>

      {successMessage && (
        <p className="a2-reward-toast" role="status">
          {successMessage}
        </p>
      )}

      <p className="a2-reward-section-title">최근 리워드 내역</p>
      <ul className="a2-reward-history">
        {APP2_REWARD_HISTORY.map((event) => (
          <li key={event.id}>
            <span className="a2-reward-history-copy">
              <strong>{event.label}</strong>
              <small>{event.date}</small>
            </span>
            <span className={event.amount >= 0 ? "is-earn" : "is-spend"}>
              {formatHoneySigned(event.amount)}
            </span>
          </li>
        ))}
      </ul>

      <p className="a2-reward-section-title">꿀 교환</p>
      <ul className="a2-exchange-list">
        {APP2_EXCHANGE_ITEMS.map((item) => {
          const isUsed = item.used || redeemed.has(item.id);
          return (
            <li key={item.id} className={isUsed ? "is-used" : ""}>
              <span className="a2-exchange-icon" aria-hidden="true">
                <Gift size={20} />
              </span>
              <span className="a2-exchange-copy">
                <strong>{item.merchant}</strong>
                <span>{item.item}</span>
                <span className="a2-exchange-cost">{formatHoney(item.cost)}</span>
              </span>
              <button
                type="button"
                className="a2-exchange-btn"
                disabled={isUsed || item.cost > balance}
                onClick={() => setConfirmItem(item)}
              >
                {isUsed ? "완료" : "교환"}
              </button>
            </li>
          );
        })}
      </ul>

      {confirmItem && (
        <div className="a2-confirm-backdrop" onClick={() => setConfirmItem(null)}>
          <div className="a2-confirm-sheet" onClick={(event) => event.stopPropagation()}>
            <strong>{confirmItem.item}</strong>
            <p className="a2-confirm-cost">{formatHoney(confirmItem.cost)}</p>
            <p className="a2-confirm-copy">이 리워드로 교환할까요?</p>
            <div className="a2-confirm-actions">
              <button type="button" onClick={() => setConfirmItem(null)}>
                취소
              </button>
              <button type="button" className="is-primary" onClick={confirmExchange}>
                교환하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
