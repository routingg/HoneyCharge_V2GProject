import type { ChargingRecord } from '@/types';

export const CHARGING_HISTORY: ChargingRecord[] = [
  { id: 'ch-001', vehicleId: 'vehicle-001', stationName: '함덕해수욕장 충전소', date: '2026-07-30 05:40', startSoc: 32, endSoc: 65, chargedKwh: 25.5, dischargedKwh: 0, durationMin: 68, pointsEarned: 1280, carbonSavedKg: 6.1 },
  { id: 'ch-002', vehicleId: 'vehicle-001', stationName: '애월 카페거리 충전소', date: '2026-07-28 14:20', startSoc: 40, endSoc: 78, chargedKwh: 29.4, dischargedKwh: 4.2, durationMin: 82, pointsEarned: 1520, carbonSavedKg: 7.0 },
  { id: 'ch-003', vehicleId: 'vehicle-001', stationName: '중문관광단지 충전소', date: '2026-07-26 16:00', startSoc: 25, endSoc: 80, chargedKwh: 42.6, dischargedKwh: 8.4, durationMin: 95, pointsEarned: 2100, carbonSavedKg: 10.3 },
  { id: 'ch-004', vehicleId: 'vehicle-002', stationName: '제주도청 충전소', date: '2026-07-25 09:10', startSoc: 30, endSoc: 70, chargedKwh: 31.0, dischargedKwh: 0, durationMin: 75, pointsEarned: 1100, carbonSavedKg: 5.4 },
  { id: 'ch-005', vehicleId: 'vehicle-001', stationName: '성산일출봉 충전소', date: '2026-07-22 11:30', startSoc: 20, endSoc: 76, chargedKwh: 43.4, dischargedKwh: 6.1, durationMin: 88, pointsEarned: 2050, carbonSavedKg: 9.8 },
  { id: 'ch-006', vehicleId: 'vehicle-003', stationName: '협재해수욕장 충전소', date: '2026-07-20 13:45', startSoc: 15, endSoc: 90, chargedKwh: 45.0, dischargedKwh: 0, durationMin: 102, pointsEarned: 2300, carbonSavedKg: 10.9 },
  { id: 'ch-007', vehicleId: 'vehicle-001', stationName: '제주공항 충전소', date: '2026-07-18 07:05', startSoc: 22, endSoc: 62, chargedKwh: 31.0, dischargedKwh: 0, durationMin: 62, pointsEarned: 980, carbonSavedKg: 4.9 },
  { id: 'ch-008', vehicleId: 'vehicle-002', stationName: '함덕 공영주차장 충전소', date: '2026-07-16 20:20', startSoc: 35, endSoc: 85, chargedKwh: 38.7, dischargedKwh: 5.5, durationMin: 90, pointsEarned: 1850, carbonSavedKg: 8.6 },
  { id: 'ch-009', vehicleId: 'vehicle-001', stationName: '오설록 충전소', date: '2026-07-14 15:10', startSoc: 40, endSoc: 78, chargedKwh: 29.4, dischargedKwh: 0, durationMin: 70, pointsEarned: 1150, carbonSavedKg: 6.7 },
  { id: 'ch-010', vehicleId: 'vehicle-003', stationName: '제주월드컵경기장 충전소', date: '2026-07-11 18:50', startSoc: 18, endSoc: 88, chargedKwh: 42.0, dischargedKwh: 7.8, durationMin: 96, pointsEarned: 2200, carbonSavedKg: 10.1 },
  { id: 'ch-011', vehicleId: 'vehicle-001', stationName: '표선해수욕장 충전소', date: '2026-07-08 10:30', startSoc: 28, endSoc: 72, chargedKwh: 34.1, dischargedKwh: 0, durationMin: 76, pointsEarned: 1340, carbonSavedKg: 7.4 },
];

export function historyForVehicle(vehicleId: string): ChargingRecord[] {
  return CHARGING_HISTORY.filter((h) => h.vehicleId === vehicleId);
}
