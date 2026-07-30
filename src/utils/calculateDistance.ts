import type { Station } from '@/types';

export interface LatLngLike {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 사이의 대권 거리(km)를 하버사인 공식으로 계산한다. */
export function calculateDistanceKm(from: LatLngLike, to: LatLngLike): number {
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** 두 좌표 사이의 거리를 미터 단위 정수로 반환한다. */
export function calculateDistanceMeters(from: LatLngLike, to: LatLngLike): number {
  return Math.round(calculateDistanceKm(from, to) * 1000);
}

/**
 * 거리 표기 규칙 통일.
 * - 1km 미만: `350m` (10m 단위 반올림)
 * - 1km 이상: `1.2km` (소수 첫째 자리)
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '-';
  if (km < 1) {
    const meters = Math.round((km * 1000) / 10) * 10;
    return `${Math.max(10, meters)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/** 미터 값을 위 규칙으로 표기한다. */
export function formatDistanceMeters(meters: number): string {
  return formatDistance(meters / 1000);
}

/** 도보 속도 4km/h 기준 예상 도보 시간(분). */
export function estimateWalkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 66.7));
}

/**
 * 충전소 목록의 `distanceKm`를 사용자 위치 기준 계산값으로 덮어쓴다.
 * 원본 배열은 변경하지 않는다.
 */
export function applyDistances<T extends Station>(stations: T[], origin: LatLngLike): T[] {
  return stations.map((station) => ({
    ...station,
    distanceKm:
      Math.round(
        calculateDistanceKm(origin, { latitude: station.lat, longitude: station.lng }) * 100
      ) / 100,
  }));
}
