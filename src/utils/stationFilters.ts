import type { Station } from '@/types';

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
