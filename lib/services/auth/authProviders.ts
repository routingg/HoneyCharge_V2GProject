"use client";

import type {
  AuthProviderAdapter,
  EmailSignInInput,
} from "@/lib/domain/auth/types";
import { upsertUserAndSignIn } from "@/lib/services/auth/authStore";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * mode "real": this is fully working client-side logic (creates/finds the
 * account and starts a session), just backed by localStorage instead of a
 * production database — see db/schema.ts (intentionally empty; no D1
 * binding is provisioned for this project, see .openai/hosting.json).
 * Passwords are never stored or verified; the email is the only identity
 * key in this demo.
 */
export const EmailAuthProvider: AuthProviderAdapter = {
  id: "email",
  label: "이메일",
  mode: "real",
  demoNotice:
    "이메일만으로 계정을 식별하는 데모 인증입니다. 비밀번호는 저장/검증되지 않습니다.",
  async signIn(input?: EmailSignInInput) {
    if (!input?.email) throw new Error("이메일을 입력해주세요.");
    await delay(400);
    const { user, isNewUser } = upsertUserAndSignIn(
      "email",
      input.email.trim().toLowerCase(),
    );
    return { user, isNewUser };
  },
};

function mockSocialProvider(
  id: "kakao" | "google" | "apple",
  label: string,
): AuthProviderAdapter {
  return {
    id,
    label,
    mode: "mock",
    demoNotice: `${label} 실제 OAuth 연동 전이라, 데모 계정으로 로그인합니다.`,
    async signIn() {
      await delay(700);
      const demoEmail = `${id}-demo-user@honeycharge.app`;
      const { user, isNewUser } = upsertUserAndSignIn(id, demoEmail, `${id}-demo`);
      return { user, isNewUser };
    },
  };
}

export const KakaoAuthProvider = mockSocialProvider("kakao", "카카오톡");
export const GoogleAuthProvider = mockSocialProvider("google", "Google");
export const AppleAuthProvider = mockSocialProvider("apple", "Apple");

/**
 * my현대 연결. Sign-in itself only creates/finds the HoneyCharge account
 * tied to a Hyundai identity — it does not call a real Hyundai Connected
 * Car API (no credentials are configured in this project). The follow-up
 * vehicle lookup/connect step lives in
 * lib/services/vehicle/vehicleRegistry.ts (HyundaiVehicleProvider).
 */
export const HyundaiAuthProvider: AuthProviderAdapter = {
  id: "hyundai",
  label: "my현대",
  mode: "mock",
  demoNotice:
    "현대자동차 Connected Car API 연동 전이라, 데모 계정·데모 차량으로 연결됩니다.",
  async signIn() {
    await delay(900);
    const demoEmail = "hyundai-demo-user@honeycharge.app";
    const { user, isNewUser } = upsertUserAndSignIn(
      "hyundai",
      demoEmail,
      "hyundai-demo",
    );
    return { user, isNewUser };
  },
};

export const AUTH_PROVIDERS: AuthProviderAdapter[] = [
  EmailAuthProvider,
  KakaoAuthProvider,
  GoogleAuthProvider,
  AppleAuthProvider,
  HyundaiAuthProvider,
];
