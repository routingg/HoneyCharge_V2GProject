import type { AppNotification } from '@/types';

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'nt-001', type: '충전 완료', title: '충전이 완료되었습니다', message: '아이오닉 6이 목표 충전량 80%까지 충전되었습니다.', createdAt: '2026-07-30 07:12', read: false, detail: '함덕해수욕장 충전소에서 진행된 충전이 완료되었습니다. 총 32.4kWh를 충전했으며 1,280P가 적립되었습니다.' },
  { id: 'nt-002', type: 'V2G 완료', title: 'V2G 방전이 완료되었습니다', message: '전력 계통에 8.2kWh를 공급하고 640P를 획득했습니다.', createdAt: '2026-07-29 18:32', read: false, detail: '오후 전력 수요 피크 시간대에 V2G 방전에 참여해 8.2kWh를 공급했습니다. 참여 보상으로 640P가 지급되었습니다.' },
  { id: 'nt-003', type: '포인트 적립', title: '2,400P가 적립되었습니다', message: '오늘 충전·방전 참여로 포인트가 적립되었습니다.', createdAt: '2026-07-29 18:35', read: true, detail: '충전 1,280P + V2G 640P + 출석 보너스 480P가 합산되어 적립되었습니다.' },
  { id: 'nt-004', type: '충전 시작', title: '스마트 충전이 시작되었습니다', message: '태양광 발전량이 증가해 충전을 자동으로 시작했습니다.', createdAt: '2026-07-29 13:05', read: true, detail: 'AI 추천 스케줄에 따라 재생에너지 비율이 높은 시간대에 충전이 시작되었습니다.' },
  { id: 'nt-005', type: '예약 알림', title: '충전소 예약이 1시간 남았습니다', message: '중문관광단지 충전소 예약 시간이 다가오고 있습니다.', createdAt: '2026-07-28 15:00', read: true, detail: '예약 시간: 16:00 / 예상 체류 시간 90분 / 목표 충전량 80%' },
  { id: 'nt-006', type: '배터리 경고', title: '배터리 잔량이 낮습니다', message: '현재 배터리 18%로 최소 보장 배터리에 근접했습니다.', createdAt: '2026-07-27 06:40', read: true, detail: '설정된 최소 보장 배터리 20%에 근접했습니다. 충전소 방문을 권장합니다.' },
  { id: 'nt-007', type: '날씨 기반 추천', title: '오늘은 맑아 태양광 발전이 풍부해요', message: '13시~16시 태양광 충전을 추천합니다.', createdAt: '2026-07-27 08:00', read: true, detail: '기상청 예보 기준 오늘 낮 시간대 일사량이 평소보다 높습니다.' },
  { id: 'nt-008', type: '재생에너지 과잉 알림', title: '재생에너지 발전량이 수요를 초과했어요', message: '지금 충전하면 추가 포인트를 받을 수 있습니다.', createdAt: '2026-07-26 14:20', read: true, detail: '제주 지역 풍력 발전량이 일시적으로 급증해 잉여 전력이 발생했습니다.' },
  { id: 'nt-009', type: '포인트 만료', title: '포인트 3,000P가 곧 만료됩니다', message: '8월 15일까지 사용하지 않으면 소멸됩니다.', createdAt: '2026-07-25 09:00', read: true, detail: '2025년 8월에 적립된 포인트 중 일부가 만료를 앞두고 있습니다.' },
  { id: 'nt-010', type: 'V2G 시작', title: 'V2G 방전이 시작되었습니다', message: '전력 수요 피크 시간대 방전을 시작합니다.', createdAt: '2026-07-24 17:00', read: true, detail: '설정된 자동 참여 조건에 따라 V2G 방전이 시작되었습니다.' },
  { id: 'nt-011', type: '충전 완료', title: '충전이 완료되었습니다', message: 'EV6가 목표 충전량 75%까지 충전되었습니다.', createdAt: '2026-07-23 21:44', read: true, detail: '애월 카페거리 충전소에서 진행된 충전이 완료되었습니다.' },
  { id: 'nt-012', type: '예약 알림', title: '예약이 확정되었습니다', message: '협재해수욕장 충전소 예약이 확정되었습니다.', createdAt: '2026-07-22 11:10', read: true, detail: '예약일 7월 25일 14:00, DC 콤보 커넥터 배정' },
  { id: 'nt-013', type: '포인트 적립', title: '리워드 교환으로 포인트가 차감되었습니다', message: '아메리카노 교환권으로 4,500P가 사용되었습니다.', createdAt: '2026-07-21 10:02', read: true, detail: '애월 카페거리 제휴점에서 사용 가능한 쿠폰으로 교환되었습니다.' },
];

export const NOTIFICATION_TYPES = [
  '전체',
  '충전 시작',
  '충전 완료',
  'V2G 시작',
  'V2G 완료',
  '포인트 적립',
  '포인트 만료',
  '예약 알림',
  '배터리 경고',
  '날씨 기반 추천',
  '재생에너지 과잉 알림',
] as const;
