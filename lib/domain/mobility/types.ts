export interface VehicleState {
  vehicleId: string;
  timestamp: string;
  soc: number;
  batteryCapacityKWh: number;
  connected: boolean;
  chargerConnected: boolean;
  driving: boolean;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  currentPowerKW: number;
}

export interface TripRecord {
  tripId: string;
  departureTime: string;
  arrivalTime: string;
  startSoc: number;
  endSoc: number;
  distanceKm: number;
  energyUsedKWh: number;
  dayOfWeek: number;
}

export interface UserMobilityPreferences {
  hardMinimumSoc: number;
  preferredReserveSoc: number;
  automaticSocProtection: boolean;
  calendarEnabled: boolean;
  calendarLocationEnabled: boolean;
}

export interface MobilityContext {
  now: string;
  timezone: string;
  vehicleState: VehicleState;
  recentTrips: TripRecord[];
  upcomingCalendarEvents: import("../calendar/types").NormalizedCalendarEvent[];
  userPreferences: UserMobilityPreferences;
}

/** Locally-computed statistical summary sent to Gemini instead of raw history (§96). */
export interface MobilityProfile {
  weekdayTypicalDepartureMinuteOfDay?: number;
  weekdayDepartureStdMinutes?: number;
  typicalReturnMinuteOfDay?: number;
  medianTripDistanceKm?: number;
  medianConsumptionKWhPerKm?: number;
  historySampleCount: number;
}

export interface DeparturePrediction {
  predictedDeparture: string;
  confidence: number;
  sourceWeights: {
    historical: number;
    calendar: number;
    gemini: number;
  };
  explanationFactors: string[];
}

export interface TripEnergyPrediction {
  predictedDistanceKm: number;
  expectedConsumptionKWhPerKm: number;
  requiredEnergyKWh: number;
  requiredTripSoc: number;
  confidence: number;
}
