import { V2GPlanBody } from "@/components/mobile/V2GPlanBody";
import type { MobilityHomeViewModel } from "@/lib/services/liveMobilityService";

/** myHyundai 카드 문법(화이트, 넓은 여백)의 오늘의 V2G 일정. 본문은 두 스킨이 공유합니다. */
export function MyHyundaiV2GSchedule({
  mvm,
  v2gEnabled,
  onToggleV2g,
  onChangeHardMinimumSoc,
}: {
  mvm: MobilityHomeViewModel;
  v2gEnabled: boolean;
  onToggleV2g: (enabled: boolean) => void;
  onChangeHardMinimumSoc: (value: number) => void;
}) {
  return (
    <section className="myhv-screen">
      <h1 className="myhv-title">오늘의 V2G</h1>
      <V2GPlanBody
        vm={mvm}
        v2gEnabled={v2gEnabled}
        onToggleV2g={onToggleV2g}
        onChangeHardMinimumSoc={onChangeHardMinimumSoc}
      />
    </section>
  );
}
