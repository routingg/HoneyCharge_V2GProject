import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import Home from '@/pages/home/Home';
import { PATHS } from './paths';

const BOOT_FLAG = 'honeycharge-booted';

export function RootGate() {
  const alreadyBooted = useRef(sessionStorage.getItem(BOOT_FLAG) === '1').current;

  useEffect(() => {
    sessionStorage.setItem(BOOT_FLAG, '1');
  }, []);

  if (!alreadyBooted) return <Navigate to={PATHS.splash} replace />;
  return <Home />;
}
