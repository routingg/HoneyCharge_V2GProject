export type V2GAction = "CHARGE" | "IDLE" | "DISCHARGE";

export interface V2GScheduleSlot {
  start: string;
  end: string;
  action: V2GAction;
  powerKW: number;
  predictedSocStart: number;
  predictedSocEnd: number;
  reasonCode: string;
  explanation: string;
}

export interface OptimizerWeights {
  gridSupport: number;
  renewableAbsorption: number;
  economicValue: number;
  batteryCyclingPenalty: number;
}

export interface V2GScheduleResult {
  slots: V2GScheduleSlot[];
  feasible: boolean;
  projectedDepartureSoc: number | null;
  totalChargedKWh: number;
  totalDischargedKWh: number;
}
