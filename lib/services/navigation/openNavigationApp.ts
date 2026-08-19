export type NavigationProviderId = "kakao" | "tmap" | "naver";

export interface NavigationDestination {
  name: string;
  latitude: number;
  longitude: number;
}

export interface NavigationProviderMeta {
  id: NavigationProviderId;
  label: string;
}

export const NAVIGATION_PROVIDERS: NavigationProviderMeta[] = [
  { id: "kakao", label: "카카오내비" },
  { id: "tmap", label: "티맵" },
  { id: "naver", label: "네이버 지도" },
];

/**
 * Deep-link URL formats below follow each provider's publicly documented
 * scheme as of this writing (카카오맵/티맵/네이버지도 URL scheme docs).
 * Re-verify against current official docs before shipping to production —
 * providers occasionally revise scheme/query parameters.
 */
function buildLinks(
  provider: NavigationProviderId,
  destination: NavigationDestination,
): { app: string; web: string } {
  const { name, latitude, longitude } = destination;
  const encodedName = encodeURIComponent(name);

  switch (provider) {
    case "kakao":
      return {
        app: `kakaomap://route?ep=${latitude},${longitude}&by=CAR`,
        web: `https://map.kakao.com/link/to/${encodedName},${latitude},${longitude}`,
      };
    case "tmap":
      return {
        app: `tmap://route?goalname=${encodedName}&goalx=${longitude}&goaly=${latitude}`,
        // Tmap does not publish a generic coordinate-based web routing URL,
        // so the web fallback points to the service homepage rather than a
        // precise route.
        web: `https://www.tmap.co.kr/`,
      };
    case "naver":
      return {
        app: `nmap://route/car?dlat=${latitude}&dlng=${longitude}&dname=${encodedName}&appname=com.honeycharge.app2`,
        web: `https://map.naver.com/p/directions/-/${longitude},${latitude},${encodedName}/-/car`,
      };
  }
}

/**
 * Attempts to open the native navigation app via its URL scheme; if the app
 * isn't installed (the scheme silently no-ops), falls back to the provider's
 * web destination after a short delay. Browser/mobile differences are
 * handled the same way here — the fallback timer is what actually degrades
 * gracefully, since we can't reliably detect app-installed state from the
 * web. Swap this implementation out for native Swift/Kotlin deep-link
 * handling in a future native app; UI callers should keep calling this same
 * function signature.
 */
export function openNavigationApp({
  provider,
  destination,
}: {
  provider: NavigationProviderId;
  destination: NavigationDestination;
}): void {
  if (typeof window === "undefined") return;
  const { app, web } = buildLinks(provider, destination);

  let fallbackFired = false;
  const openFallback = () => {
    if (fallbackFired) return;
    fallbackFired = true;
    window.open(web, "_blank", "noopener,noreferrer");
  };
  const fallbackTimer = window.setTimeout(openFallback, 900);
  const cancelFallback = () => {
    fallbackFired = true;
    window.clearTimeout(fallbackTimer);
  };
  window.addEventListener("pagehide", cancelFallback, { once: true });
  window.addEventListener("blur", cancelFallback, { once: true });

  window.location.href = app;
}
