import { OnboardingScreen } from '@/components/common/OnboardingScreen';
import { IMAGES } from '@/data/imageSources';
import { PATHS } from '@/routes/paths';

export default function OnboardingVehicle() {
  return (
    <OnboardingScreen
      step={3}
      image={IMAGES.evTeslaModelS.url}
      imageAlt={IMAGES.evTeslaModelS.alt}
      eyebrow="THREE. 출발 시간에 맞춘 스마트 충전"
      title={'출발 30분 전,\n딱 맞는 배터리로 준비 완료'}
      description={'출발 예정 시간과 목표 배터리 잔량을 설정하면\nAI가 최적의 충전·방전 스케줄을 자동으로 추천합니다.'}
      nextPath={PATHS.login}
      isLast
    />
  );
}
