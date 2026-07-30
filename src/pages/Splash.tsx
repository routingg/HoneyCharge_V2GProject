import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/common/Logo';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from '@/routes/paths';

export default function Splash() {
  const navigate = useNavigate();
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!onboardingCompleted) navigate(PATHS.onboardingEnergy, { replace: true });
      else if (!isAuthenticated) navigate(PATHS.login, { replace: true });
      else navigate(PATHS.home, { replace: true });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [navigate, onboardingCompleted, isAuthenticated]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col items-center justify-center gap-6 bg-gradient-to-b from-light-yellow to-bg">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <Logo size={88} withWordmark />
      </motion.div>
      <motion.div
        className="h-1 w-32 overflow-hidden rounded-full bg-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          className="h-full bg-primary-gold"
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
        />
      </motion.div>
      <p className="text-sm text-dark-gold">꿀처럼 달콤한 전기차 충전</p>
    </div>
  );
}
