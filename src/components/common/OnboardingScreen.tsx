import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { PrimaryButton } from './PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { PATHS } from '@/routes/paths';
import { cn } from '@/utils/cn';

interface OnboardingScreenProps {
  step: number;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  nextPath: string;
  isLast?: boolean;
}

const TOTAL_STEPS = 3;

export function OnboardingScreen({
  step,
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  nextPath,
  isLast = false,
}: OnboardingScreenProps) {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const handleNext = () => {
    if (isLast) completeOnboarding();
    navigate(nextPath, { replace: isLast });
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate(PATHS.login, { replace: true });
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-(--width-app) flex-col bg-bg">
      <div className="flex justify-end px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button type="button" onClick={handleSkip} className="min-h-[44px] px-2 text-sm font-medium text-text-secondary">
          건너뛰기
        </button>
      </div>
      <div className="relative mx-4 mt-2 aspect-[4/3] overflow-hidden rounded-card">
        <ImageWithFallback src={image} alt={imageAlt} className="h-full w-full object-cover" wrapperClassName="h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col px-6 pt-8">
        <p className="text-sm font-bold text-dark-gold">{eyebrow}</p>
        <h1 className="mt-2 text-[22px] font-extrabold leading-snug text-text">{title}</h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">{description}</p>
      </div>
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
        <div className="mb-5 flex items-center justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn('h-1.5 rounded-full transition-all', i === step - 1 ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
            />
          ))}
        </div>
        <PrimaryButton onClick={handleNext}>{isLast ? '시작하기' : '다음'}</PrimaryButton>
      </div>
    </div>
  );
}
