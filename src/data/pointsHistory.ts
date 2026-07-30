import type { PointHistoryItem } from '@/types';

function build(): PointHistoryItem[] {
  const items: Omit<PointHistoryItem, 'balanceAfter'>[] = [
    { id: 'pt-001', date: '2026-07-30 07:12', type: '적립', amount: 1280, description: '함덕해수욕장 충전 적립' },
    { id: 'pt-002', date: '2026-07-29 18:35', type: '적립', amount: 640, description: 'V2G 방전 참여 보상' },
    { id: 'pt-003', date: '2026-07-28 14:40', type: '적립', amount: 1520, description: '애월 카페거리 충전 적립' },
    { id: 'pt-004', date: '2026-07-27 09:15', type: '사용', amount: -4500, description: '아메리카노 1잔 교환권 교환' },
    { id: 'pt-005', date: '2026-07-26 16:20', type: '적립', amount: 2100, description: '중문관광단지 충전 적립' },
    { id: 'pt-006', date: '2026-07-25 09:25', type: '적립', amount: 1100, description: '제주도청 충전 적립' },
    { id: 'pt-007', date: '2026-07-24 12:00', type: '사용', amount: -1500, description: '아이스크림 교환권 교환' },
    { id: 'pt-008', date: '2026-07-22 11:45', type: '적립', amount: 2050, description: '성산일출봉 충전 적립' },
    { id: 'pt-009', date: '2026-07-20 14:00', type: '적립', amount: 2300, description: '협재해수욕장 충전 적립' },
    { id: 'pt-010', date: '2026-07-18 07:20', type: '적립', amount: 980, description: '제주공항 충전 적립' },
    { id: 'pt-011', date: '2026-07-16 20:35', type: '적립', amount: 1850, description: '함덕 공영주차장 충전 적립' },
    { id: 'pt-012', date: '2026-07-15 09:00', type: '만료', amount: -800, description: '2025년 1월 적립분 만료' },
    { id: 'pt-013', date: '2026-07-14 15:25', type: '적립', amount: 1150, description: '오설록 충전 적립' },
    { id: 'pt-014', date: '2026-07-11 19:05', type: '적립', amount: 2200, description: '제주월드컵경기장 충전 적립' },
    { id: 'pt-015', date: '2026-07-09 10:00', type: '사용', amount: -12000, description: '렌터카 1일 무료 업그레이드 교환' },
    { id: 'pt-016', date: '2026-07-08 10:45', type: '적립', amount: 1340, description: '표선해수욕장 충전 적립' },
    { id: 'pt-017', date: '2026-07-05 08:00', type: '적립', amount: 500, description: '출석 보너스' },
  ];
  let balance = 84200;
  const withBalance: PointHistoryItem[] = [];
  for (const item of items) {
    withBalance.push({ ...item, balanceAfter: balance });
    balance -= item.amount;
  }
  return withBalance;
}

export const POINTS_HISTORY: PointHistoryItem[] = build();

export const CURRENT_POINTS = 84200;
