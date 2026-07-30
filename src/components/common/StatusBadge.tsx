import { CheckCircle2, Circle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type Tone = 'success' | 'neutral' | 'warning' | 'danger';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  neutral: 'bg-[#EEF0F2] text-text-secondary',
  warning: 'bg-primary/15 text-dark-gold',
  danger: 'bg-danger/10 text-danger',
};

const TONE_ICONS: Record<Tone, typeof CheckCircle2> = {
  success: CheckCircle2,
  neutral: Circle,
  warning: AlertCircle,
  danger: XCircle,
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const Icon = TONE_ICONS[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-chip px-2.5 py-1 text-xs font-semibold',
        TONE_STYLES[tone]
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
