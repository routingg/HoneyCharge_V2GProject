/** SIMULATED grid signal — not a real utility/ISO feed (§30). */
export interface GridSignal {
  timestamp: string;
  gridDemandLevel: number; // normalized, roughly [-1, 1]; positive = high demand
  renewableSurplusKW: number;
  energyValue: number; // normalized economic value of discharging now
}
