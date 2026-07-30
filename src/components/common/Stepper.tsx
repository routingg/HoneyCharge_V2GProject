import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
}

export function Stepper({ value, onChange, min = 0, max = 100, step = 1, unit = '', label }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`${label ?? ''} 감소`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text disabled:opacity-30'
        )}
      >
        <Minus size={18} aria-hidden="true" />
      </button>
      <div className="min-w-[72px] text-center text-xl font-bold tabular-nums text-text">
        {value}
        {unit}
      </div>
      <button
        type="button"
        aria-label={`${label ?? ''} 증가`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-text disabled:opacity-30"
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
