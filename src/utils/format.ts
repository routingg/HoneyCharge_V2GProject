export function formatPoints(n: number): string {
  return `${n.toLocaleString('ko-KR')}P`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function formatKwh(n: number): string {
  return `${n.toFixed(1)}kWh`;
}

export function formatKm(n: number): string {
  return `${n.toLocaleString('ko-KR')}km`;
}
