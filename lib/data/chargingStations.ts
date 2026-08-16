export type StationStatus = "available" | "busy" | "offline";

export interface DemoChargingStation {
  id: string;
  name: string;
  lng: number;
  lat: number;
  distanceKm: number;
  isV2G: boolean;
  isFast: boolean;
  status: StationStatus;
  availableCount: number;
  totalCount: number;
  powerKw: number;
  waitMinutes: number;
}

/** 실제 설비 데이터가 아닌 시연용 제주 충전소 8곳입니다. */
export const DEMO_CHARGING_STATIONS: DemoChargingStation[] = [
  {
    id: "jeju-icc",
    name: "제주 ICC 충전소",
    lng: 126.4913,
    lat: 33.4996,
    distanceKm: 0.8,
    isV2G: true,
    isFast: true,
    status: "available",
    availableCount: 2,
    totalCount: 4,
    powerKw: 350,
    waitMinutes: 5,
  },
  {
    id: "jeju-airport",
    name: "제주공항 충전소",
    lng: 126.4931,
    lat: 33.5113,
    distanceKm: 2.1,
    isV2G: true,
    isFast: true,
    status: "busy",
    availableCount: 0,
    totalCount: 6,
    powerKw: 200,
    waitMinutes: 18,
  },
  {
    id: "jeju-city-hall",
    name: "제주시청 충전소",
    lng: 126.5219,
    lat: 33.4996,
    distanceKm: 3.4,
    isV2G: true,
    isFast: false,
    status: "available",
    availableCount: 3,
    totalCount: 4,
    powerKw: 100,
    waitMinutes: 0,
  },
  {
    id: "nohyeong",
    name: "노형 로터리 충전소",
    lng: 126.4805,
    lat: 33.483,
    distanceKm: 4.6,
    isV2G: false,
    isFast: true,
    status: "available",
    availableCount: 1,
    totalCount: 2,
    powerKw: 100,
    waitMinutes: 0,
  },
  {
    id: "jungmun",
    name: "중문관광단지 충전소",
    lng: 126.4147,
    lat: 33.2506,
    distanceKm: 22.3,
    isV2G: true,
    isFast: true,
    status: "available",
    availableCount: 4,
    totalCount: 4,
    powerKw: 350,
    waitMinutes: 0,
  },
  {
    id: "seogwipo",
    name: "서귀포시청 충전소",
    lng: 126.5608,
    lat: 33.2541,
    distanceKm: 24.8,
    isV2G: false,
    isFast: false,
    status: "offline",
    availableCount: 0,
    totalCount: 3,
    powerKw: 50,
    waitMinutes: 0,
  },
  {
    id: "hallim",
    name: "한림항 충전소",
    lng: 126.2656,
    lat: 33.4109,
    distanceKm: 18.5,
    isV2G: true,
    isFast: false,
    status: "busy",
    availableCount: 0,
    totalCount: 2,
    powerKw: 100,
    waitMinutes: 12,
  },
  {
    id: "seongsan",
    name: "성산일출봉 충전소",
    lng: 126.9316,
    lat: 33.4587,
    distanceKm: 41.2,
    isV2G: false,
    isFast: true,
    status: "available",
    availableCount: 2,
    totalCount: 4,
    powerKw: 200,
    waitMinutes: 0,
  },
];
