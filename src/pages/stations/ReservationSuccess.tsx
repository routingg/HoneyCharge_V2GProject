import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useAppStore } from '@/store/useAppStore';
import { formatPoints } from '@/utils/format';
import { PATHS } from '@/routes/paths';

export default function ReservationSuccess() {
  const navigate = useNavigate();
  const reservation = useAppStore((s) => s.reservations[0]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-y-auto bg-bg px-5 py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
          <CalendarCheck size={38} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-text">예약이 완료되었어요!</h1>
        <p className="mt-1 text-sm text-text-secondary">예약 시간에 맞춰 충전소를 방문해 주세요</p>
      </motion.div>

      {reservation && (
        <Card className="mt-6">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-text-secondary">충전소</dt>
            <dd className="text-right font-semibold text-text">{reservation.stationName}</dd>
            <dt className="text-text-secondary">날짜</dt>
            <dd className="text-right font-semibold text-text">{reservation.date}</dd>
            <dt className="text-text-secondary">시간</dt>
            <dd className="text-right font-semibold text-text">{reservation.time}</dd>
            <dt className="text-text-secondary">충전기</dt>
            <dd className="text-right font-semibold text-text">{reservation.chargerType}</dd>
            <dt className="text-text-secondary">목표 SOC</dt>
            <dd className="text-right font-semibold text-text">{reservation.targetSoc}%</dd>
            <dt className="text-text-secondary">예상 포인트</dt>
            <dd className="text-right font-semibold text-dark-gold">{formatPoints(reservation.expectedPoints)}</dd>
          </dl>
        </Card>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <PrimaryButton onClick={() => navigate(PATHS.home)}>홈으로 이동</PrimaryButton>
        <SecondaryButton onClick={() => navigate(PATHS.stations)}>다른 충전소 보기</SecondaryButton>
      </div>
    </div>
  );
}
