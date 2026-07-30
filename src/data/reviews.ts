import type { Review } from '@/types';

export const REVIEWS: Review[] = [
  { id: 'rv-001', stationId: 'st-004', userName: '바다사랑', rating: 5, content: '해변 바로 앞이라 충전하면서 산책하기 좋아요.', createdAt: '2026-07-28' },
  { id: 'rv-002', stationId: 'st-004', userName: '전기차초보', rating: 4, content: '충전 속도 빠르고 자리도 넉넉했습니다.', createdAt: '2026-07-25' },
  { id: 'rv-003', stationId: 'st-009', userName: '카페투어', rating: 5, content: '충전하는 동안 카페에서 커피 한 잔! 최고예요.', createdAt: '2026-07-27' },
  { id: 'rv-004', stationId: 'st-009', userName: '제주도민', rating: 5, content: '동네 충전소 중 가장 관리가 잘 되어 있어요.', createdAt: '2026-07-20' },
  { id: 'rv-005', stationId: 'st-005', userName: '여행중독', rating: 4, content: '일출봉 구경 전에 충전하고 갔어요. 자리는 조금 붐빕니다.', createdAt: '2026-07-22' },
  { id: 'rv-006', stationId: 'st-001', userName: '출장러', rating: 4, content: '공항 이용객이 많아 대기가 있을 수 있어요.', createdAt: '2026-07-26' },
  { id: 'rv-007', stationId: 'st-006', userName: '중문산책', rating: 5, content: '리조트 이용하면서 V2G까지 참여했어요.', createdAt: '2026-07-19' },
  { id: 'rv-008', stationId: 'st-010', userName: '협재비치', rating: 5, content: '뷰가 예술입니다. 충전 속도도 빠름.', createdAt: '2026-07-18' },
  { id: 'rv-009', stationId: 'st-002', userName: '도청직원', rating: 5, content: '무료 주차에 충전까지, 출근길에 딱이에요.', createdAt: '2026-07-15' },
  { id: 'rv-010', stationId: 'st-011', userName: '티타임', rating: 4, content: '오설록 구경하면서 여유롭게 충전했습니다.', createdAt: '2026-07-14' },
];

export function reviewsForStation(stationId: string): Review[] {
  return REVIEWS.filter((r) => r.stationId === stationId);
}
