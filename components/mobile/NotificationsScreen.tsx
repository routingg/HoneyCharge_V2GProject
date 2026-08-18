import { BellRing, CalendarClock, ShieldCheck, Timer, Zap } from "lucide-react";
import type { AuditEvent } from "@/lib/domain/audit/types";

const ICON: Record<string, typeof BellRing> = {
  TIME_ADVANCED: Timer,
  CALENDAR_CHANGED: CalendarClock,
  USER_RESERVE_CHANGED: ShieldCheck,
  V2G_TOGGLED: Zap,
};

function describe(event: AuditEvent): { title: string; detail: string } {
  switch (event.trigger) {
    case "TIME_ADVANCED":
      return {
        title: "시간이 흘렀어요",
        detail: `${event.details.minutes}분이 지나 배터리 상태와 V2G 계획을 다시 계산했어요.`,
      };
    case "CALENDAR_CHANGED": {
      const before = String(event.details.beforeDeparture ?? "").slice(11, 16);
      const after = String(event.details.afterDeparture ?? "").slice(11, 16);
      return {
        title: "일정이 변경됐어요",
        detail: `예상 출발이 ${before} → ${after}로 바뀌어 HoneyCharge가 V2G 계획을 자동으로 조정했어요.`,
      };
    }
    case "USER_RESERVE_CHANGED":
      return {
        title: "배터리 보호 설정이 변경됐어요",
        detail: event.details.hardMinimumSoc
          ? `최소 보장 배터리를 ${event.details.hardMinimumSoc}%로 바꿨어요.`
          : `여유 배터리 설정을 ${event.details.preferredReserveSoc}%로 바꿨어요.`,
      };
    case "V2G_TOGGLED":
      return {
        title: event.details.v2gEnabled ? "자동 V2G를 켰어요" : "자동 V2G를 껐어요",
        detail: event.details.v2gEnabled
          ? "여유 배터리를 다시 전력망과 공유해요."
          : "설정을 끌 때까지 방전하지 않아요.",
      };
    default:
      return { title: event.trigger, detail: "" };
  }
}

/**
 * Client-side, session-only notification history (§28) sourced from the
 * same AuditLog the live-mobility engine already writes to when the demo
 * scenario changes — not a separate notification system.
 */
export function NotificationsScreen({ events }: { events: AuditEvent[] }) {
  return (
    <section className="hc-subpage" aria-label="알림">
      <h1>알림</h1>
      <p className="hc-subpage-hint">이번 세션에서 발생한 변경 사항이에요.</p>

      {events.length === 0 ? (
        <p className="hc-subpage-empty">아직 알림이 없어요.</p>
      ) : (
        <ul className="hc-notification-list">
          {[...events].reverse().map((event, index) => {
            const Icon = ICON[event.trigger] ?? BellRing;
            const { title, detail } = describe(event);
            return (
              <li key={index}>
                <span className="hc-notification-icon">
                  <Icon size={16} />
                </span>
                <span className="hc-notification-copy">
                  <strong>{title}</strong>
                  {detail && <span>{detail}</span>}
                  <time>{new Date(event.timestamp).toLocaleTimeString("ko-KR")}</time>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
