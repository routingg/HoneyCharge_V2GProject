import { NextResponse } from "next/server";
import { runFixedVsAdaptiveBacktest } from "@/lib/domain/validation/backtest";

const DEFAULT_VEHICLE = {
  vehicleId: "OWN-002",
  batteryCapacityKWh: 77.4,
  maxChargePowerKW: 6.4,
  maxDischargePowerKW: 9,
};

function numberParam(url: URL, key: string, fallback: number): number {
  const raw = url.searchParams.get(key);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * §45–§51, §64: runs the fixed-vs-adaptive backtest server-side over
 * synthetic (clearly-labeled) trip history and returns the comparison the
 * /validation dashboard renders. Every number here comes from
 * `runFixedVsAdaptiveBacktest` — nothing is hardcoded in this route.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const seed = numberParam(url, "seed", 42);
  const fixedMinimumSoc = numberParam(url, "fixedMinimumSoc", 50);
  const hardMinimumSoc = numberParam(url, "hardMinimumSoc", 20);
  const userReserveSoc = numberParam(url, "userReserveSoc", 15);
  const historyDays = Math.min(90, Math.max(14, numberParam(url, "historyDays", 30)));

  const result = runFixedVsAdaptiveBacktest({
    ...DEFAULT_VEHICLE,
    hardMinimumSoc,
    userReserveSoc,
    fixedMinimumSoc,
    historyDays,
    minHistoryTripsBeforeScoring: 7,
    seed,
    endDate: new Date(),
  });

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
