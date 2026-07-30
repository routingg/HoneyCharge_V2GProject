import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from './paths';

export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);

  if (!onboardingCompleted) return <Navigate to={PATHS.onboardingEnergy} replace />;
  if (!isAuthenticated) return <Navigate to={PATHS.login} replace />;
  return <>{children}</>;
}
