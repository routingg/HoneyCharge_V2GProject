import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Leaf, Clock, Coins, BatteryCharging } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function ChargingResult() {
  const navigate = useNavigate();
  const result = useAppStore((s) => s.lastChargingResult);

  if (!result) {
    navigate(PATHS.home, { replace: true });
    return null;
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-y-auto bg-bg px-5 py-8">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={40} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-text">충전이 완료되었어요!</h1>
        <p className="mt-1 text-sm text-text-secondary">{result.stationName}</p>
      </motion.div>

      <Card className="mt-6">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs text-text-secondary">시작 배터리</p>
            <p className="text-2xl font-extrabold text-text">{result.startSoc}%</p>
          </div>
          <span className="text-text-secondary">→</span>
          <div className="text-center">
            <p className="text-xs text-text-secondary">종료 배터리</p>
            <p className="text-2xl font-extrabold text-success">{result.endSoc}%</p>
          </div>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <BatteryCharging size={12} aria-hidden="true" />
            충전량
          </p>
          <p className="mt-1 text-lg font-extrabold text-text">{result.chargedKwh}kWh</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <BatteryCharging size={12} aria-hidden="true" />
            전력망에 나눈 양
          </p>
          <p className="mt-1 text-lg font-extrabold text-text">{result.dischargedKwh}kWh</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <Clock size={12} aria-hidden="true" />
            소요 시간
          </p>
          <p className="mt-1 text-lg font-extrabold text-text">{result.durationMin}분</p>
        </Card>
        <Card>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <Leaf size={12} aria-hidden="true" />
            탄소 절감
          </p>
          <p className="mt-1 text-lg font-extrabold text-text">{result.carbonSavedKg}kg</p>
        </Card>
      </div>

      <Card className="mt-3 bg-light-yellow">
        <div className="flex items-center justify-center gap-2">
          <Coins size={20} className="text-dark-gold" aria-hidden="true" />
          <p className="text-2xl font-extrabold text-dark-gold">{formatPoints(result.pointsEarned)} 적립</p>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-2.5">
        <PrimaryButton onClick={() => navigate(PATHS.home)}>홈으로 이동</PrimaryButton>
        <SecondaryButton onClick={() => navigate(PATHS.impact)}>환경 리포트 보기</SecondaryButton>
      </div>
    </div>
  );
}
