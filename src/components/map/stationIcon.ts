import L from 'leaflet';
import type { Station } from '@/types';

function colorFor(station: Station): string {
  if (station.availableChargers === 0) return '#DC2626';
  if (station.congestion === '혼잡') return '#B88A00';
  return '#16A34A';
}

export function createStationIcon(station: Station, selected: boolean): L.DivIcon {
  const color = colorFor(station);
  const size = selected ? 40 : 30;
  return L.divIcon({
    className: 'honeycharge-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${color};border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:${selected ? 16 : 13}px;
        transform: ${selected ? 'scale(1.05)' : 'scale(1)'};
        transition: transform .15s ease;
      ">⚡</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'honeycharge-user-marker',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:#1976D2;border:3px solid white;box-shadow:0 0 0 4px rgba(25,118,210,0.25);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
