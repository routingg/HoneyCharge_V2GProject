import { WalletBody } from "@/components/mobile/WalletBody";
import type { VehicleSchedule } from "@/lib/services/mobileHomeService";

/**
 * myHyundai의 HoneyWallet(스펙 §28~30) + Energy Insight(§41~42) 문법.
 * 본문은 두 스킨이 공유합니다(WalletBody).
 */
export function MyHyundaiWallet({ schedule }: { schedule: VehicleSchedule }) {
  return (
    <div className="myhv-screen">
      <h1 className="myhv-title">HoneyWallet</h1>
      <WalletBody schedule={schedule} />
    </div>
  );
}
