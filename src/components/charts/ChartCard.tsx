import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-text">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
