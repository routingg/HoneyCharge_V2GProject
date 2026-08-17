"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { V2GScheduleSlot } from "@/lib/domain/v2g/types";

const ACTION_COLOR: Record<string, string> = {
  CHARGE: "#238561",
  DISCHARGE: "#d9893b",
  IDLE: "#9aa39d",
};

interface TimelineChartProps {
  slots: V2GScheduleSlot[];
  guaranteedSoc: number;
  hardMinimumSoc: number;
}

/**
 * §58: 24h timeline — predicted SOC vs. the guaranteed-SOC floor, with
 * charge/discharge/idle intervals visible. Every point comes straight
 * from the schedule the optimizer actually produced.
 */
export function TimelineChart({ slots, guaranteedSoc, hardMinimumSoc }: TimelineChartProps) {
  const data = slots.map((slot) => ({
    time: slot.start.slice(11, 16),
    soc: slot.predictedSocEnd,
    action: slot.action,
    reasonCode: slot.reasonCode,
    powerKW: slot.powerKW,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#238561" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#238561" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e7e4" />
          <XAxis dataKey="time" interval={5} tick={{ fontSize: 11, fill: "#6e7974" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6e7974" }} width={32} />
          <ReferenceLine
            y={guaranteedSoc}
            stroke="#315d80"
            strokeDasharray="4 4"
            label={{ value: `보장 ${guaranteedSoc}%`, position: "insideTopRight", fontSize: 11, fill: "#315d80" }}
          />
          <ReferenceLine
            y={hardMinimumSoc}
            stroke="#b3413a"
            strokeDasharray="2 4"
            label={{ value: `최소 ${hardMinimumSoc}%`, position: "insideBottomRight", fontSize: 11, fill: "#b3413a" }}
          />
          <Tooltip
            formatter={(value, _name, item) => [
              `${value}% · ${item.payload.action} (${item.payload.reasonCode})`,
              "SOC",
            ]}
          />
          <Area type="stepAfter" dataKey="soc" stroke="#238561" strokeWidth={2} fill="url(#socGradient)" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "var(--muted)" }}>
        {Object.entries(ACTION_COLOR).map(([action, color]) => (
          <span key={action} className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
            {action}
          </span>
        ))}
      </div>
    </div>
  );
}
