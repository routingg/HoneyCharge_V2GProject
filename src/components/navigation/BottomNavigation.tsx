import { NavLink } from 'react-router-dom';
import { Home, BatteryCharging, Gift, Map, Car } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';

const ITEMS = [
  { to: PATHS.home, label: '홈', icon: Home, end: true },
  { to: PATHS.participate, label: '참여', icon: BatteryCharging, end: false },
  { to: PATHS.rewards, label: '리워드', icon: Gift, end: false },
  { to: PATHS.map, label: '지도', icon: Map, end: false },
  { to: PATHS.vehicle, label: '내 차량', icon: Car, end: false },
];

export function BottomNavigation() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="flex shrink-0 items-stretch border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
              isActive ? 'text-dark-gold' : 'text-text-secondary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
