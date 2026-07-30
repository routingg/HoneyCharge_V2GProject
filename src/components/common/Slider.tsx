interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  formatValue?: (v: number) => string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, formatValue }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-semibold text-text">{formatValue ? formatValue(value) : value}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${percent}%, var(--color-border) ${percent}%)`,
        }}
      />
    </div>
  );
}
