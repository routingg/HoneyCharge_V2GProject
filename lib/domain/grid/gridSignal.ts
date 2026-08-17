import { toKstIso } from "../clock";
import type { GridSignal } from "./types";

/**
 * SIMULATED grid signal generator (§30) — not a real utility/ISO feed.
 * Deterministic given a seed: renewable surplus peaks midday, demand
 * (and energy value of discharging) peaks morning/evening.
 */
export function generateSimulatedGridSignals(
  startTime: Date,
  slotMinutes: number,
  horizonSlots: number,
): GridSignal[] {
  const signals: GridSignal[] = [];
  for (let i = 0; i < horizonSlots; i++) {
    const slotStart = new Date(startTime.getTime() + i * slotMinutes * 60_000);
    const hour = Number(toKstIso(slotStart).slice(11, 13)) + Number(toKstIso(slotStart).slice(14, 16)) / 60;

    const solarShape = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const renewableSurplusKW = Math.round(solarShape * 400);

    const morningPeak = Math.exp(-((hour - 8) ** 2) / 4);
    const eveningPeak = Math.exp(-((hour - 19) ** 2) / 6);
    const gridDemandLevel = Number(
      Math.min(1, Math.max(-1, morningPeak * 0.9 + eveningPeak - solarShape * 0.6)).toFixed(2),
    );

    signals.push({
      timestamp: toKstIso(slotStart),
      gridDemandLevel,
      renewableSurplusKW,
      energyValue: gridDemandLevel,
    });
  }
  return signals;
}
