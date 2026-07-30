import { OnboardingScreen } from '@/components/common/OnboardingScreen';
import { IMAGES } from '@/data/imageSources';
import { PATHS } from '@/routes/paths';

export default function OnboardingEnergy() {
  return (
    <OnboardingScreen
      step={1}
      image={IMAGES.solarFarmSky.url}
      imageAlt={IMAGES.solarFarmSky.alt}
      eyebrow="ONE. 남는 재생에너지 활용"
      title={'해가 뜨고 바람이 부는 시간,\n그 순간의 전기로 충전해요'}
      description={'태양광과 풍력 발전량이 늘어나는 시간대를 분석해\n가장 깨끗하고 저렴한 전력으로 자동 충전합니다.'}
      nextPath={PATHS.onboardingReward}
    />
  );
}
