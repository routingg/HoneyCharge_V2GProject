"use client";

import type { AuthProviderId, HoneyChargeUser } from "@/lib/domain/auth/types";
import type { RegisteredVehicle } from "@/lib/domain/vehicle/registeredVehicle";

export interface App2State {
  users: HoneyChargeUser[];
  sessionUserId: string | null;
  vehicle: RegisteredVehicle | null;
}

const STORAGE_KEY = "honeycharge-app2-state";

const EMPTY_STATE: App2State = {
  users: [],
  sessionUserId: null,
  vehicle: null,
};

function readState(): App2State {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<App2State>;
    return {
      users: parsed.users ?? [],
      sessionUserId: parsed.sessionUserId ?? null,
      vehicle: parsed.vehicle ?? null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

const listeners = new Set<() => void>();

function writeState(state: App2State) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cachedRaw = null; // force getApp2StateSnapshot to reparse on next read
  listeners.forEach((listener) => listener());
}

let cached: App2State = EMPTY_STATE;
let cachedRaw: string | null | undefined;

/** useSyncExternalStore subscribe fn — same pattern as SkinProvider.tsx. */
export function subscribeApp2State(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getApp2StateSnapshot(): App2State {
  if (typeof window === "undefined") return EMPTY_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = readState();
  return cached;
}

export function getApp2ServerSnapshot(): App2State {
  return EMPTY_STATE;
}

function mutate(mutator: (state: App2State) => App2State): App2State {
  const next = mutator(readState());
  writeState(next);
  return next;
}

function findUserByProvider(
  users: HoneyChargeUser[],
  authProvider: AuthProviderId,
  email: string,
): HoneyChargeUser | undefined {
  return users.find(
    (user) => user.authProvider === authProvider && user.email === email,
  );
}

/**
 * Unified login/auto-signup: looks the (provider, email) pair up in the
 * local demo user store; creates a new record on first sight. Either way
 * the returned user becomes the active session.
 */
export function upsertUserAndSignIn(
  authProvider: AuthProviderId,
  email: string,
  providerUserId?: string,
): { user: HoneyChargeUser; isNewUser: boolean } {
  const now = new Date().toISOString();
  let resultUser!: HoneyChargeUser;
  let isNewUser = false;

  mutate((state) => {
    const existing = findUserByProvider(state.users, authProvider, email);
    if (existing) {
      resultUser = { ...existing, updatedAt: now };
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === existing.id ? resultUser : user,
        ),
        sessionUserId: resultUser.id,
      };
    }
    isNewUser = true;
    resultUser = {
      id: `${authProvider}-${crypto.randomUUID()}`,
      email,
      authProvider,
      providerUserId,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    return {
      ...state,
      users: [...state.users, resultUser],
      sessionUserId: resultUser.id,
    };
  });

  return { user: resultUser, isNewUser };
}

export function signOut() {
  mutate((state) => ({ ...state, sessionUserId: null }));
}

export function completeOnboarding() {
  mutate((state) => {
    if (!state.sessionUserId) return state;
    return {
      ...state,
      users: state.users.map((user) =>
        user.id === state.sessionUserId
          ? { ...user, onboardingCompleted: true, updatedAt: new Date().toISOString() }
          : user,
      ),
    };
  });
}

export function setVehicle(vehicle: RegisteredVehicle) {
  mutate((state) => ({ ...state, vehicle }));
}
