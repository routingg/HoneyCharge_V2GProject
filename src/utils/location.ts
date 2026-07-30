import type { LocationSource, UserLocation } from '@/types';
import { DEFAULT_USER_LOCATION } from '@/data/location';

export const LOCATION_SOURCE_LABEL: Record<LocationSource, string> = {
  browser: '실제 현재 위치',
  'hotel-default': '글로스터호텔 함덕 기준',
  demo: '데모 위치',
};

export const LOCATION_PERMISSION_DENIED_MESSAGE =
  '위치 권한을 사용할 수 없어 글로스터호텔 함덕을 기준으로 보여드려요.';

export const LOCATION_LOADING_MESSAGE = '현재 위치를 확인하고 있어요';

export interface BrowserLocationResult {
  ok: boolean;
  location: UserLocation;
  source: LocationSource;
  message: string;
}

/**
 * 브라우저 Geolocation API로 실제 위치를 요청한다.
 * 실패(권한 거부/미지원/타임아웃)해도 예외를 던지지 않고
 * 글로스터호텔 함덕 기본 위치로 폴백한 결과를 돌려준다.
 */
export function requestBrowserLocation(timeoutMs = 8000): Promise<BrowserLocationResult> {
  const fallback: BrowserLocationResult = {
    ok: false,
    location: DEFAULT_USER_LOCATION,
    source: 'hotel-default',
    message: LOCATION_PERMISSION_DENIED_MESSAGE,
  };

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(fallback);
  }

  return new Promise((resolve) => {
    let settled = false;
    let safetyTimer = 0;
    const finish = (result: BrowserLocationResult) => {
      if (settled) return;
      settled = true;
      if (safetyTimer) window.clearTimeout(safetyTimer);
      resolve(result);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        finish({
          ok: true,
          location: {
            name: '현재 위치',
            address: '브라우저에서 확인한 실제 위치',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          source: 'browser',
          message: '실제 현재 위치를 기준으로 다시 계산했어요',
        });
      },
      () => finish(fallback),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );

    // 일부 환경에서 콜백이 아예 오지 않는 경우를 대비한 안전장치
    safetyTimer = window.setTimeout(() => finish(fallback), timeoutMs + 500);
  });
}
