// Core domain types for HoneyCharge

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  memberGrade: '그린' | '실버' | '골드' | '플래티넘';
  joinedAt: string;
  region: string;
}

export interface Vehicle {
  id: string;
  isRepresentative: boolean;
  manufacturer: string;
  model: string;
  modelYear: number;
  batteryCapacityKwh: number;
  licensePlate: string;
  connected: boolean;
  currentSoc: number;
  estimatedRangeKm: number;
  lastChargedAt: string;
  image: string;
  connectedCar: boolean;
  stats: {
    totalSessions: number;
    totalPoints: number;
    totalChargedKwh: number;
    totalDischargedKwh: number;
    carbonSavedKg: number;
    batteryProtectionGrade: 'A' | 'B' | 'C';
  };
  batteryHealth: {
    healthPercent: number;
    cycleCount: number;
    fastChargeRatio: number;
    averageSoc: number;
    protectionScore: number;
    recentSoc: { day: string; soc: number }[];
  };
}

export type ConnectorType = 'DC 콤보' | 'AC 완속' | 'DC 차데모';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distanceKm: number;
  totalChargers: number;
  availableChargers: number;
  chargeSpeedKw: number;
  connectorTypes: ConnectorType[];
  v2gAvailable: boolean;
  operatingHours: string;
  is24h: boolean;
  parkingFee: string;
  isFreeParking: boolean;
  expectedPoints: number;
  partnerBenefit: string | null;
  image: string;
  congestion: '여유' | '보통' | '혼잡';
  rating: number;
  reviewCount: number;
  category: string;
}

export interface Review {
  id: string;
  stationId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export type RewardCategory =
  | '전체'
  | '카페'
  | '편의점'
  | '렌터카'
  | '세차'
  | '관광'
  | '친환경 상품';

export interface Reward {
  id: string;
  name: string;
  brand: string;
  image: string;
  requiredPoints: number;
  validityDays: number;
  remainingQuantity: number;
  isPopular: boolean;
  category: RewardCategory;
  description: string;
  howToUse: string[];
  precautions: string[];
}

export interface Coupon {
  id: string;
  rewardId: string;
  rewardName: string;
  brand: string;
  couponCode: string;
  exchangedAt: string;
  expiresAt: string;
  used: boolean;
}

export type NotificationType =
  | '충전 시작'
  | '충전 완료'
  | 'V2G 시작'
  | 'V2G 완료'
  | '포인트 적립'
  | '포인트 만료'
  | '예약 알림'
  | '배터리 경고'
  | '날씨 기반 추천'
  | '재생에너지 과잉 알림';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  detail?: string;
}

export interface ChargingRecord {
  id: string;
  vehicleId: string;
  stationName: string;
  date: string;
  startSoc: number;
  endSoc: number;
  chargedKwh: number;
  dischargedKwh: number;
  durationMin: number;
  pointsEarned: number;
  carbonSavedKg: number;
}

export interface PointHistoryItem {
  id: string;
  date: string;
  type: '적립' | '사용' | '만료';
  amount: number;
  description: string;
  balanceAfter: number;
}

export interface Reservation {
  id: string;
  stationId: string;
  stationName: string;
  date: string;
  time: string;
  vehicleId: string;
  chargerType: ConnectorType;
  expectedStayMin: number;
  targetSoc: number;
  v2gParticipate: boolean;
  expectedPoints: number;
  status: '예약완료' | '이용완료' | '취소';
  createdAt: string;
}

export interface HourlyEnergyPoint {
  hour: number;
  priceWon: number;
  renewableRatio: number;
  socForecast: number;
  solarGenKw: number;
  windGenKw: number;
  demandLevel: '낮음' | '보통' | '높음';
}

export interface DailyEnergyPoint {
  date: string;
  chargedKwh: number;
  dischargedKwh: number;
  points: number;
  carbonSavedKg: number;
}

export interface AiScheduleEvent {
  time: string;
  title: string;
  description: string;
  icon: 'solar' | 'price' | 'target' | 'v2g-start' | 'v2g-end' | 'ready';
}

export interface AiSchedule {
  id: string;
  createdFor: string;
  weather: string;
  weatherIcon: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  departureTime: string;
  currentSoc: number;
  targetSoc: number;
  minSoc: number;
  expectedDepartureSoc: number;
  estimatedChargeHours: number;
  estimatedV2gHours: number;
  estimatedPoints: number;
  reason: string;
  timeline: AiScheduleEvent[];
  hourly: HourlyEnergyPoint[];
}

export interface ChargingSettings {
  targetSoc: number;
  minSoc: number;
  departureTime: string;
  allowV2g: boolean;
  autoParticipate: boolean;
  batteryProtection: boolean;
  maxDischargeKw: number;
  notifyChargeComplete: boolean;
  notifyV2gStart: boolean;
}

export type ChargingPhase = 'charging' | 'v2g' | 'paused' | 'completed';

export interface ChargingSession {
  id: string;
  stationName: string;
  vehicleId: string;
  startedAt: string;
  startSoc: number;
  currentSoc: number;
  targetSoc: number;
  minSoc: number;
  phase: ChargingPhase;
  currentKw: number;
  totalChargedKwh: number;
  totalDischargedKwh: number;
  pointsEarned: number;
  estimatedCompletionAt: string;
  isPaused: boolean;
}

export interface ChargingResult {
  startSoc: number;
  endSoc: number;
  chargedKwh: number;
  dischargedKwh: number;
  durationMin: number;
  pointsEarned: number;
  carbonSavedKg: number;
  stationName: string;
  completedAt: string;
}

export interface AppSettings {
  pushEnabled: boolean;
  chargeCompleteAlert: boolean;
  v2gAlert: boolean;
  marketingAlert: boolean;
  darkMode: boolean;
  unit: 'km' | 'mi';
  demoMode: boolean;
}
