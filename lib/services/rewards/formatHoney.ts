/**
 * Centralized formatter for HoneyCharge's reward currency display ("꿀").
 * Internal fields (rewardPoints, pointCost, ...) stay numeric point values —
 * only the /app2 UI layer renders them as 꿀 via this formatter.
 */
export function formatHoney(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}꿀`;
}

export function formatHoneySigned(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("ko-KR")}꿀`;
}
