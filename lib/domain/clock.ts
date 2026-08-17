/**
 * Clock abstraction (§73 of the spec). Domain logic must never call
 * `new Date()` directly so that simulation/tests can control time
 * deterministically.
 */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Deterministic, manually-advanced clock used by the simulator and tests. */
export class SimulatedClock implements Clock {
  private current: Date;

  constructor(start: Date) {
    this.current = new Date(start.getTime());
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(date: Date): void {
    this.current = new Date(date.getTime());
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

export const HONEYCHARGE_TIMEZONE = "Asia/Seoul";
const KST_OFFSET = "+09:00";

/** Formats a Date as an ISO string carrying the fixed Asia/Seoul (+09:00) offset. */
export function toKstIso(date: Date): string {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = kst.getFullYear();
  const m = pad(kst.getMonth() + 1);
  const d = pad(kst.getDate());
  const hh = pad(kst.getHours());
  const mm = pad(kst.getMinutes());
  const ss = pad(kst.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${KST_OFFSET}`;
}

export function minuteOfDay(date: Date): number {
  // Uses the wall-clock component of a KST-formatted ISO string so the
  // result is stable regardless of the host machine's local timezone.
  const iso = toKstIso(date);
  const hh = Number(iso.slice(11, 13));
  const mm = Number(iso.slice(14, 16));
  return hh * 60 + mm;
}

export function dayOfWeekKst(date: Date): number {
  const iso = toKstIso(date);
  // Construct a UTC date from the KST wall-clock fields so getUTCDay()
  // reflects the Seoul calendar day regardless of host timezone.
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
