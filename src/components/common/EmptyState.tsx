import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
        <Icon size={28} aria-hidden="true" />
      </div>
      <p className="text-[15px] font-semibold text-text">{title}</p>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      {action}
    </div>
  );
}
