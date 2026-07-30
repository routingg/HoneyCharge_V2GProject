import { Sun, Tag, Target, BatteryCharging, Square, CheckCircle2 } from 'lucide-react';
import type { AiScheduleEvent } from '@/types';

const ICONS: Record<AiScheduleEvent['icon'], typeof Sun> = {
  solar: Sun,
  price: Tag,
  target: Target,
  'v2g-start': BatteryCharging,
  'v2g-end': Square,
  ready: CheckCircle2,
};

interface TimelineProps {
  events: AiScheduleEvent[];
  activeIndex?: number;
}

export function Timeline({ events, activeIndex = -1 }: TimelineProps) {
  return (
    <ol className="relative flex flex-col gap-6 pl-2">
      {events.map((event, i) => {
        const Icon = ICONS[event.icon];
        const isActive = i === activeIndex;
        const isPast = activeIndex >= 0 && i < activeIndex;
        return (
          <li key={`${event.time}-${i}`} className="relative flex gap-3 pl-8">
            {i < events.length - 1 && (
              <span className="absolute left-[15px] top-8 h-[calc(100%+8px)] w-px bg-border" aria-hidden="true" />
            )}
            <span
              className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                isActive
                  ? 'border-primary bg-primary text-[#202124]'
                  : isPast
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-card text-text-secondary'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </span>
            <div className="pb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-dark-gold">{event.time}</span>
                <span className="text-[15px] font-bold text-text">{event.title}</span>
              </div>
              <p className="mt-0.5 text-sm text-text-secondary">{event.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
