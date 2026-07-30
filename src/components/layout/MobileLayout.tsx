import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { cn } from '@/utils/cn';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showHeader?: boolean;
  showBottomNav?: boolean;
  contentClassName?: string;
  noPadding?: boolean;
  scrollable?: boolean;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  onBack,
  showHeader = true,
  showBottomNav = true,
  contentClassName,
  noPadding = false,
  scrollable = true,
}: MobileLayoutProps) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-hidden bg-bg md:shadow-elevated">
      {showHeader && <AppHeader title={title} showBack={showBack} onBack={onBack} />}
      <main
        className={cn(
          'relative flex-1 overflow-x-hidden',
          scrollable ? 'overflow-y-auto' : 'overflow-hidden',
          !noPadding && 'px-4 py-4',
          contentClassName
        )}
      >
        {children}
      </main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
