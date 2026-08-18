import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";

/**
 * §14–§16: Google Calendar connection UX. No OAuth integration exists yet
 * (this codebase's calendar layer only normalizes/consumes already-fetched
 * events — see lib/domain/calendar/normalize.ts), so this screen is
 * explicitly and permanently labeled Demo/Simulated rather than pretending
 * to be a real connected-account flow (§47).
 */
export function CalendarSettingsScreen({
  calendarEnabled,
  onToggle,
  events,
}: {
  calendarEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  events: NormalizedCalendarEvent[];
}) {
  return (
    <section className="hc-subpage" aria-label="캘린더 연동">
      <h1>연동 서비스</h1>
      <p className="hc-subpage-hint">
        캘린더 일정은 다음 출발 시각을 예측하는 데만 참고돼요. 일정 내용 전체를
        가져오지 않고, 시간·장소 여부만 최소한으로 사용해요.
      </p>

      <div className="hc-calendar-card">
        <div className="hc-calendar-card-head">
          <span className="hc-calendar-card-icon">
            <Calendar size={18} />
          </span>
          <div>
            <strong>Google 캘린더</strong>
            <span className={`hc-calendar-status is-${calendarEnabled ? "connected" : "off"}`}>
              {calendarEnabled ? (
                <>
                  <CheckCircle2 size={12} /> Demo 연결됨
                </>
              ) : (
                <>
                  <XCircle size={12} /> 연결 안 됨
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            className="hc-calendar-toggle"
            aria-pressed={calendarEnabled}
            onClick={() => onToggle(!calendarEnabled)}
          >
            {calendarEnabled ? "연동 끄기" : "연동 켜기 (Demo)"}
          </button>
        </div>
        <p className="hc-calendar-note">
          실제 Google 계정과 연동되지 않은 시연용 상태예요. 홈 화면의 &ldquo;일정
          변경&rdquo; 버튼으로 캘린더 변경 시나리오를 시뮬레이션할 수 있어요.
        </p>
      </div>

      <p className="hc-subpage-section-title">오늘 반영된 일정 신호</p>
      {events.length === 0 ? (
        <p className="hc-subpage-empty">아직 반영된 캘린더 신호가 없어요.</p>
      ) : (
        <ul className="hc-calendar-event-list">
          {events.map((event) => (
            <li key={event.id}>
              <span>{event.start.slice(11, 16)}</span>
              <strong>{event.location ?? "위치 비공개"}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
