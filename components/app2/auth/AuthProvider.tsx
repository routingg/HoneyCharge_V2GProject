"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type {
  AuthProviderAdapter,
  AuthResult,
  EmailSignInInput,
  HoneyChargeUser,
} from "@/lib/domain/auth/types";
import type { RegisteredVehicle } from "@/lib/domain/vehicle/registeredVehicle";
import {
  completeOnboarding as completeOnboardingStore,
  getApp2ServerSnapshot,
  getApp2StateSnapshot,
  signOut as signOutStore,
  subscribeApp2State,
} from "@/lib/services/auth/authStore";

export type App2SessionStatus = "unauthenticated" | "onboarding" | "ready";

interface App2SessionValue {
  status: App2SessionStatus;
  user: HoneyChargeUser | null;
  vehicle: RegisteredVehicle | null;
  signInWith: (
    provider: AuthProviderAdapter,
    input?: EmailSignInInput,
  ) => Promise<AuthResult>;
  completeOnboarding: () => void;
  signOut: () => void;
}

const App2SessionContext = createContext<App2SessionValue | null>(null);

export function useApp2Session(): App2SessionValue {
  const ctx = useContext(App2SessionContext);
  if (!ctx) {
    throw new Error("useApp2Session must be used within App2SessionProvider");
  }
  return ctx;
}

/**
 * Session/onboarding/vehicle state for /app2, backed by
 * lib/services/auth/authStore.ts (localStorage). Same
 * useSyncExternalStore + Context shape as SkinProvider.tsx in /mobile, so
 * anything under this provider re-renders automatically when auth state
 * changes anywhere (including other tabs, via the browser "storage" event
 * → subscribeApp2State listeners).
 */
export function App2SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useSyncExternalStore(
    subscribeApp2State,
    getApp2StateSnapshot,
    getApp2ServerSnapshot,
  );
  const user = state.users.find((u) => u.id === state.sessionUserId) ?? null;

  const value = useMemo<App2SessionValue>(() => {
    const status: App2SessionStatus = !user
      ? "unauthenticated"
      : !user.onboardingCompleted
        ? "onboarding"
        : "ready";
    return {
      status,
      user,
      vehicle: state.vehicle,
      async signInWith(provider, input) {
        return provider.signIn(input);
      },
      completeOnboarding: completeOnboardingStore,
      signOut: signOutStore,
    };
  }, [user, state.vehicle]);

  return (
    <App2SessionContext.Provider value={value}>
      {children}
    </App2SessionContext.Provider>
  );
}
