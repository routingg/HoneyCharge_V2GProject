import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from '@/routes/paths';

export default function RewardExchangeSuccess() {
  const navigate = useNavigate();
  const coupon = useAppStore((s) => s.coupons[0]);

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col overflow-y-auto bg-bg px-5 py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-light-yellow text-dark-gold">
          <PartyPopper size={38} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-text">교환이 완료되었어요!</h1>
        <p className="mt-1 text-sm text-text-secondary">쿠폰함에서 언제든 다시 확인할 수 있어요</p>
      </motion.div>

      {coupon && (
        <Card className="mt-6">
          <p className="text-sm text-text-secondary">{coupon.brand}</p>
          <p className="font-bold text-text">{coupon.rewardName}</p>
          <div className="mt-4 flex flex-col items-center rounded-2xl bg-bg py-4">
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="w-1 bg-[#202124]" style={{ height: i % 3 === 0 ? 36 : 24 }} />
              ))}
            </div>
            <p className="mt-2 font-mono text-sm font-semibold tracking-wider text-text">{coupon.couponCode}</p>
          </div>
          <p className="mt-3 text-center text-xs text-text-secondary">유효기간 {coupon.expiresAt}까지</p>
        </Card>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <PrimaryButton onClick={() => navigate(PATHS.profile)}>쿠폰함 보기</PrimaryButton>
        <SecondaryButton onClick={() => navigate(PATHS.rewards)}>리워드 홈으로</SecondaryButton>
      </div>
    </div>
  );
}
