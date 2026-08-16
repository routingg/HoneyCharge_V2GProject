"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type HoneyChargeSkin = "epit" | "myhyundai";

const SKIN_STORAGE_KEY = "honeycharge-skin";
const DEFAULT_SKIN: HoneyChargeSkin = "epit";

function isSkin(value: string | null): value is HoneyChargeSkin {
  return value === "epit" || value === "myhyundai";
}

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): HoneyChargeSkin {
  const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
  return isSkin(stored) ? stored : DEFAULT_SKIN;
}

function getServerSnapshot(): HoneyChargeSkin {
  return DEFAULT_SKIN;
}

function writeSkin(next: HoneyChargeSkin) {
  window.localStorage.setItem(SKIN_STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

interface SkinContextValue {
  skin: HoneyChargeSkin;
  setSkin: (skin: HoneyChargeSkin) => void;
}

const SkinContext = createContext<SkinContextValue>({
  skin: DEFAULT_SKIN,
  setSkin: () => undefined,
});

export function useSkin() {
  return useContext(SkinContext);
}

/**
 * localStorage를 useSyncExternalStore로 구독합니다. ?skin= 쿼리 파라미터는
 * 발표용 1회성 오버라이드로, 최초 마운트 시 저장소에 한 번 반영만 하고
 * (외부 스토어 변경 → 구독자 알림) React state는 직접 건드리지 않습니다.
 */
export function SkinProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const skin = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const queryParam = new URLSearchParams(window.location.search).get(
      "skin",
    );
    if (isSkin(queryParam) && queryParam !== getSnapshot()) {
      writeSkin(queryParam);
    }
  }, []);

  const value = useMemo(
    () => ({ skin, setSkin: writeSkin }),
    [skin],
  );

  return (
    <SkinContext.Provider value={value}>{children}</SkinContext.Provider>
  );
}
