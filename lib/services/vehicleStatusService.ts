import type {
  VehicleSchedule,
  VehicleStatus,
} from "@/lib/types";

const FULL_SOC_THRESHOLD = 95;

export function getVehicleDisplayStatus(
  schedule: VehicleSchedule,
  currentHour: number,
): VehicleStatus {
  const { vehicle } = schedule;
  if (!vehicle.isConnected) return "offline";

  const currentItem = schedule.items[currentHour];
  if (
    currentItem?.action === "charge" &&
    currentItem.powerKw > 0
  ) {
    return "charging";
  }
  if (
    currentItem?.action === "discharge" &&
    currentItem.powerKw > 0
  ) {
    return "discharging";
  }

  const currentSoc =
    currentItem?.expectedSocAfter ?? vehicle.currentSoc;
  if (currentSoc >= FULL_SOC_THRESHOLD) return "full";
  if (!vehicle.isV2GEnabled) return "not-enrolled";

  return "standby";
}
