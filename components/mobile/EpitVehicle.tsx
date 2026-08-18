import { VehicleStatusBody } from "@/components/mobile/VehicleStatusBody";
import type {
  MobilityHomeViewModel,
  MobilityPatternViewModel,
} from "@/lib/services/liveMobilityService";

/**
 * E-pit 카드 문법의 "마이카" 화면. myHyundai의 차량 상태 화면과 동일한
 * 기능(배터리·연결·V2G·최소 배터리·주행거리·다음 출발·이동 패턴)을
 * 제공하되, 디자인은 E-pit의 화이트/민트 카드 언어를 따릅니다. 본문은
 * 두 스킨이 공유합니다(VehicleStatusBody).
 */
export function EpitVehicle({
  mvm,
  pattern,
}: {
  mvm: MobilityHomeViewModel;
  pattern: MobilityPatternViewModel;
}) {
  return (
    <div className="epit-v2g">
      <VehicleStatusBody mvm={mvm} pattern={pattern} />
    </div>
  );
}
