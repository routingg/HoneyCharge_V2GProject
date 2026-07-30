import type { DailyEnergyPoint, HourlyEnergyPoint } from '@/types';

// Deterministic pseudo-random generator so the mock dataset stays stable
// across reloads within a session (nicer for live demos than Math.random()).
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260730);

export const DAILY_ENERGY: DailyEnergyPoint[] = Array.from({ length: 32 }).map((_, i) => {
  const dayOffset = 31 - i;
  const d = new Date(2026, 6, 30);
  d.setDate(d.getDate() - dayOffset);
  const chargedKwh = Math.round((22 + rand() * 20) * 10) / 10;
  const dischargedKwh = Math.round(rand() * 9 * 10) / 10;
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    chargedKwh,
    dischargedKwh,
    points: Math.round(chargedKwh * 38 + dischargedKwh * 55),
    carbonSavedKg: Math.round((chargedKwh * 0.233 + dischargedKwh * 0.1) * 10) / 10,
  };
});

const demandCurve: Array<'낮음' | '보통' | '높음'> = [
  '낮음', '낮음', '낮음', '낮음', '낮음', '보통',
  '보통', '높음', '높음', '보통', '보통', '보통',
  '보통', '보통', '보통', '보통', '높음', '높음',
  '높음', '높음', '보통', '보통', '낮음', '낮음',
];

export const HOURLY_ENERGY: HourlyEnergyPoint[] = Array.from({ length: 24 }).map((_, hour) => {
  const solarPeak = Math.max(0, 1 - Math.abs(hour - 13) / 7);
  const windBase = 0.4 + rand() * 0.3;
  const solarGenKw = Math.round(solarPeak * 42 * (0.8 + rand() * 0.4) * 10) / 10;
  const windGenKw = Math.round(windBase * 18 * 10) / 10;
  const renewableRatio = Math.min(95, Math.round(30 + solarGenKw * 1.1 + windGenKw * 0.8));
  const basePrice = demandCurve[hour] === '높음' ? 210 : demandCurve[hour] === '보통' ? 150 : 110;
  const priceWon = Math.round(basePrice - renewableRatio * 0.4);
  const socForecast = Math.min(100, Math.round(35 + hour * 2.1 + solarGenKw * 0.3));
  return {
    hour,
    priceWon,
    renewableRatio,
    socForecast,
    solarGenKw,
    windGenKw,
    demandLevel: demandCurve[hour],
  };
});
