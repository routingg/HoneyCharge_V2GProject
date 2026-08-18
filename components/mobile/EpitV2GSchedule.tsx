import { V2GPlanBody } from "@/components/mobile/V2GPlanBody";
import type { MobilityHomeViewModel } from "@/lib/services/liveMobilityService";

/** E-pit 카드 문법(다크 요약 + 화이트 리스트)의 오늘의 V2G 일정. 본문은 두 스킨이 공유합니다. */
export function EpitV2GSchedule({
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
    <div className="epit-v2g">
      <V2GPlanBody
        vm={mvm}
        v2gEnabled={v2gEnabled}
        onToggleV2g={onToggleV2g}
        onChangeHardMinimumSoc={onChangeHardMinimumSoc}
      />
    </div>
  );
}
