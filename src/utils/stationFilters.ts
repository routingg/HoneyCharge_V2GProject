import type { Station } from '@/types';
import { HOTEL_STATION_ID } from '@/data/location';
import { calculateDistanceKm, type LatLngLike } from './calculateDistance';

export function applyStationFilter(station: Station, filter: string): boolean {
  switch (filter) {
    case '사용 가능':
      return station.availableChargers > 0;
    case 'V2G 가능':
      return station.v2gAvailable;
    case '급속':
      return station.chargeSpeedKw >= 100;
    case '무료 주차':
      return station.isFreeParking;
    case '24시간':
      return station.is24h;
    case '제휴 혜택':
      return !!station.partnerBenefit;
    default:
      return true;
  }
}

export function filterStations(stations: Station[], activeFilters: string[], query: string): Station[] {
  const q = query.trim().toLowerCase();
  return stations.filter((station) => {
    const matchesFilters = activeFilters.every((f) => applyStationFilter(station, f));
    const matchesQuery =
      !q || station.name.toLowerCase().includes(q) || station.address.toLowerCase().includes(q) || station.category.toLowerCase().includes(q);
    return matchesFilters && matchesQuery;
  });
}

export function sortStations(stations: Station[], sortKey: string): Station[] {
  const copy = [...stations];
  switch (sortKey) {
    case '포인트 높은 순':
      return copy.sort((a, b) => b.expectedPoints - a.expectedPoints);
    case '평점 높은 순':
      return copy.sort((a, b) => b.rating - a.rating);
    case '가까운 순':
    default:
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

/** 사용자 위치에서 가장 가까운 충전소 */
export function nearestStation(stations: Station[], origin: LatLngLike): Station | null {
  if (stations.length === 0) return null;
  return stations.reduce((closest, station) => {
    const d = calculateDistanceKm(origin, { latitude: station.lat, longitude: station.lng });
    const closestD = calculateDistanceKm(origin, { latitude: closest.lat, longitude: closest.lng });
    return d < closestD ? station : closest;
  }, stations[0]);
}

/**
 * 화면 공통으로 사용할 "기준 충전소"를 결정한다.
 * 1) 사용자가 직접 선택한 충전소
 * 2) 현재 위치에서 가장 가까운 충전소
 * 3) 글로스터호텔 함덕 주차장 mock 충전소
 * 4) 기존 기본 충전소(목록 첫 번째)
 */
export function resolveSelectedStation(
  stations: Station[],
  selectedId: string | null,
  origin: LatLngLike
): Station | null {
  if (stations.length === 0) return null;
  const picked = selectedId ? stations.find((s) => s.id === selectedId) : undefined;
  if (picked) return picked;
  return (
    nearestStation(stations, origin) ??
    stations.find((s) => s.id === HOTEL_STATION_ID) ??
    stations[0]
  );
}

/**
 * 차량이 실제로 받아들일 수 있는 유효 충전 출력(kW).
 * 프로토타입이므로 충전기 출력을 50kW로 상한 처리한다.
 */
export function effectiveChargingPowerKw(station: Station | null | undefined): number {
  if (!station) return 11;
  return Math.min(station.chargeSpeedKw, 50);
}
