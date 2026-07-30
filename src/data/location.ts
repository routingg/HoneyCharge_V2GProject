import type { UserLocation } from '@/types';

/**
 * 앱의 기본 사용자 위치.
 *
 * 좌표는 "제주특별자치도 제주시 조천읍 조함해안로 502"(글로스터호텔 함덕) 주소를
 * 함덕해수욕장 해안도로 구간에 대응시켜 지정한 **근사 좌표**입니다.
 * 측량/지오코딩 API로 검증한 값이 아니므로 프로토타입 시연용으로만 사용합니다.
 */
export const DEFAULT_USER_LOCATION: UserLocation = {
  name: '글로스터호텔 함덕',
  address: '제주특별자치도 제주시 조천읍 조함해안로 502',
  latitude: 33.5434,
  longitude: 126.6693,
};

/** 글로스터호텔 함덕의 영문 표기(지도 접근성 라벨 등에서 사용). */
export const DEFAULT_USER_LOCATION_EN = 'Gloucester Hotel Hamdeok';

/** 호텔 주변 충전소와 제휴 매장이 함께 보이는 확대 수준. */
export const DEFAULT_MAP_ZOOM = 15;

/** 제주 전역을 한눈에 보는 확대 수준(기존 동작 유지용). */
export const JEJU_OVERVIEW_ZOOM = 11;

/** 호텔에 딸린 mock 충전소 id. selectedStation 기본값 폴백에 사용. */
export const HOTEL_STATION_ID = 'st-016';
