"use client";

import type { RegisteredVehicle } from "@/lib/domain/vehicle/registeredVehicle";
import { setVehicle } from "@/lib/services/auth/authStore";

export interface ManualVehicleInput {
  plateNumber: string;
  manufacturer: string;
  model: string;
  batteryCapacityKWh: number;
}

/** Case A (§6): email/Kakao/Google/Apple users register a vehicle by hand. */
export const MockVehicleProvider = {
  source: "manual" as const,
  registerManualVehicle(input: ManualVehicleInput): RegisteredVehicle {
    const vehicle: RegisteredVehicle = {
      id: `manual-${crypto.randomUUID()}`,
      source: "manual",
      manufacturer: input.manufacturer,
      model: input.model,
      plateNumber: input.plateNumber || undefined,
      batteryCapacityKWh: input.batteryCapacityKWh,
      connectedAt: new Date().toISOString(),
    };
    setVehicle(vehicle);
    return vehicle;
  },
};

export interface HyundaiVehicleCandidate {
  id: string;
  model: string;
  trim: string;
  batteryCapacityKWh: number;
  plateNumber: string;
}

/**
 * Case B (§6): my현대 연동 → 차량 자동 검색 → 연결. Demo candidate list only
 * — no real Hyundai Connected Car API is configured. Swap this module for a
 * real HyundaiVehicleProvider implementation once API access exists; the
 * fetchCandidateVehicles/connectVehicle call sites in the UI don't need to
 * change.
 */
const DEMO_HYUNDAI_VEHICLES: HyundaiVehicleCandidate[] = [
  {
    id: "hyundai-demo-ioniq5",
    model: "아이오닉 5",
    trim: "롱레인지 2WD",
    batteryCapacityKWh: 77.4,
    plateNumber: "12가 3456",
  },
];

export const HyundaiVehicleProvider = {
  source: "hyundai" as const,
  async fetchCandidateVehicles(): Promise<HyundaiVehicleCandidate[]> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return DEMO_HYUNDAI_VEHICLES;
  },
  connectVehicle(candidate: HyundaiVehicleCandidate): RegisteredVehicle {
    const vehicle: RegisteredVehicle = {
      id: candidate.id,
      source: "hyundai",
      manufacturer: "현대자동차",
      model: `${candidate.model} ${candidate.trim}`,
      plateNumber: candidate.plateNumber,
      batteryCapacityKWh: candidate.batteryCapacityKWh,
      connectedAt: new Date().toISOString(),
    };
    setVehicle(vehicle);
    return vehicle;
  },
};
