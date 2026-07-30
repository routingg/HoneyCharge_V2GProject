import type { Reservation } from '@/types';

export const RESERVATIONS: Reservation[] = [
  { id: 'rs-001', stationId: 'st-006', stationName: '중문관광단지 충전소', date: '2026-08-02', time: '16:00', vehicleId: 'vehicle-001', chargerType: 'DC 콤보', expectedStayMin: 90, targetSoc: 80, v2gParticipate: true, expectedPoints: 420, status: '예약완료', createdAt: '2026-07-29' },
  { id: 'rs-002', stationId: 'st-004', stationName: '함덕해수욕장 충전소', date: '2026-07-24', time: '10:00', vehicleId: 'vehicle-001', chargerType: 'DC 차데모', expectedStayMin: 60, targetSoc: 75, v2gParticipate: false, expectedPoints: 380, status: '이용완료', createdAt: '2026-07-20' },
  { id: 'rs-003', stationId: 'st-010', stationName: '협재해수욕장 충전소', date: '2026-07-20', time: '14:00', vehicleId: 'vehicle-003', chargerType: 'DC 콤보', expectedStayMin: 100, targetSoc: 90, v2gParticipate: false, expectedPoints: 360, status: '이용완료', createdAt: '2026-07-16' },
  { id: 'rs-004', stationId: 'st-009', stationName: '애월 카페거리 충전소', date: '2026-07-15', time: '13:30', vehicleId: 'vehicle-002', chargerType: 'AC 완속', expectedStayMin: 120, targetSoc: 78, v2gParticipate: true, expectedPoints: 300, status: '이용완료', createdAt: '2026-07-11' },
  { id: 'rs-005', stationId: 'st-001', stationName: '제주공항 충전소', date: '2026-07-10', time: '07:00', vehicleId: 'vehicle-001', chargerType: 'DC 콤보', expectedStayMin: 45, targetSoc: 60, v2gParticipate: false, expectedPoints: 320, status: '취소', createdAt: '2026-07-08' },
];
