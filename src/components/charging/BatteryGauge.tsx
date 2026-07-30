import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BatteryGaugeProps {
  soc: number;
  size?: number;
  minSoc?: number;
  targetSoc?: number;
  charging?: boolean;
  label?: string;
}

export function BatteryGauge({ soc, size = 168, minSoc, targetSoc, charging = false, label }: BatteryGaugeProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, soc));
  const offset = circumference * (1 - clamped / 100);

  const color = clamped < 20 ? 'var(--color-danger)' : clamped < 50 ? 'var(--color-primary-gold)' : 'var(--color-success)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-[#EEF0F2]" fill="none" />
        {minSoc !== undefined && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="var(--color-danger)"
            strokeOpacity={0.25}
            strokeDasharray={`${(minSoc / 100) * circumference} ${circumference}`}
            fill="none"
            strokeLinecap="round"
          />
        )}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
        {targetSoc !== undefined && (
          <circle
            cx={size / 2 + radius * Math.cos((targetSoc / 100) * 2 * Math.PI)}
            cy={size / 2 + radius * Math.sin((targetSoc / 100) * 2 * Math.PI)}
            r={4}
            fill="var(--color-info)"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        {charging && <Zap size={16} className="mb-0.5 fill-primary text-primary" aria-hidden="true" />}
        <span className="text-3xl font-extrabold tabular-nums text-text">{Math.round(clamped)}%</span>
        {label && <span className="mt-0.5 text-xs text-text-secondary">{label}</span>}
      </div>
    </div>
  );
}
