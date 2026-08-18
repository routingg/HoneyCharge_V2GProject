import { WalletBody } from "@/components/mobile/WalletBody";
import type { VehicleSchedule } from "@/lib/services/mobileHomeService";

/** E-pit 카드 문법의 HoneyWallet + Energy Insight. 본문은 두 스킨이 공유합니다(WalletBody). */
export function EpitRewards({ schedule }: { schedule: VehicleSchedule }) {
  return (
    <div className="epit-v2g">
      <WalletBody schedule={schedule} />
    </div>
  );
}
