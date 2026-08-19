export type AuthProviderId = "email" | "kakao" | "google" | "apple" | "hyundai";

export interface HoneyChargeUser {
  id: string;
  email: string;
  authProvider: AuthProviderId;
  providerUserId?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: HoneyChargeUser;
  isNewUser: boolean;
}

export interface EmailSignInInput {
  email: string;
  password: string;
}

/**
 * One adapter per provider so UI components never branch on provider id —
 * they call `adapter.signIn()` and get back a normalized AuthResult.
 * `demoNotice` is surfaced in the UI so mock providers are never confused
 * with a real, credentialed integration (see lib/services/auth/authProviders.ts).
 */
export interface AuthProviderAdapter {
  id: AuthProviderId;
  label: string;
  mode: "real" | "mock";
  demoNotice?: string;
  signIn(input?: EmailSignInInput): Promise<AuthResult>;
}
