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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 사용자 현재 위치 마커.
 * 충전소 마커(원형 ⚡ 핀)와 확실히 구분되도록 파란 펄스 점 + 라벨을 함께 그린다.
 */
export function createUserLocationIcon(label = '현재 위치'): L.DivIcon {
  const safeLabel = escapeHtml(label);
  return L.divIcon({
    className: 'honeycharge-user-marker',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
          <span style="
            position:absolute;inset:0;border-radius:9999px;
            background:rgba(25,118,210,0.28);
          " class="animate-pulse-ring"></span>
          <span style="
            position:relative;width:16px;height:16px;border-radius:9999px;
            background:#1976D2;border:3px solid white;
            box-shadow:0 0 0 4px rgba(25,118,210,0.25);
          "></span>
        </div>
        <span style="
          margin-top:4px;white-space:nowrap;
          background:#1976D2;color:#fff;
          padding:2px 8px;border-radius:999px;
          font-size:11px;font-weight:700;
          box-shadow:0 2px 6px rgba(32,33,36,0.28);
        ">${safeLabel}</span>
      </div>
    `,
    iconSize: [22, 44],
    iconAnchor: [11, 11],
  });
}

/**
 * 관광지 마커 — 충전소(원형 초록/노랑 ⚡)와 확실히 구분되도록
 * 흰 배경 + 청록 테두리의 물방울형 핀으로 그린다.
 */
export function createAttractionIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'honeycharge-attraction-marker',
    html: `
      <div style="
        width:28px;height:28px;
        background:#ffffff;border:2.5px solid #0891B2;
        border-radius:9999px 9999px 9999px 2px;
        transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.28);
        display:flex;align-items:center;justify-content:center;
      "><span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

/** 제휴 매장 마커 (충전소·현재 위치와 구분되는 골드 사각 핀) */
export function createPartnerStoreIcon(label: string): L.DivIcon {
  const safeLabel = escapeHtml(label);
  return L.divIcon({
    className: 'honeycharge-store-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:28px;height:28px;border-radius:10px;
          background:#F8C51C;border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;font-size:13px;
        ">🎁</div>
        <span style="
          margin-top:4px;white-space:nowrap;
          background:#715600;color:#fff;
          padding:2px 8px;border-radius:999px;
          font-size:11px;font-weight:700;
          box-shadow:0 2px 6px rgba(32,33,36,0.28);
        ">${safeLabel}</span>
      </div>
    `,
    iconSize: [28, 50],
    iconAnchor: [14, 14],
  });
}
