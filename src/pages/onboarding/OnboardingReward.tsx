import { OnboardingScreen } from '@/components/common/OnboardingScreen';
import { IMAGES } from '@/data/imageSources';
import { PATHS } from '@/routes/paths';

export default function OnboardingReward() {
  return (
    <OnboardingScreen
      step={2}
      image={IMAGES.evChargingPlugCloseup.url}
      imageAlt={IMAGES.evChargingPlugCloseup.alt}
      eyebrow="TWO. 충전하면서 포인트 적립"
      title={'충전만 해도, 방전에 참여해도\n꿀 같은 포인트가 쌓여요'}
      description={'전력 수요가 높은 시간에 배터리 전력을 계통에 공급(V2G)하면\n포인트와 정산금으로 돌려받을 수 있습니다.'}
      nextPath={PATHS.onboardingVehicle}
    />
  );
}
