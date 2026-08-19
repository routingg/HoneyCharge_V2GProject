"use client";

import { useState, type FormEvent } from "react";
import { useApp2Session } from "@/components/app2/auth/AuthProvider";
import { AppleMark, GoogleMark, HyundaiMark, KakaoMark } from "@/components/app2/auth/BrandIcons";
import type { AuthProviderAdapter, EmailSignInInput } from "@/lib/domain/auth/types";
import {
  AppleAuthProvider,
  EmailAuthProvider,
  GoogleAuthProvider,
  HyundaiAuthProvider,
  KakaoAuthProvider,
} from "@/lib/services/auth/authProviders";

type Status = "idle" | "loading" | "error";

/**
 * Unified login/auto-signup screen (§1, §3): one primary CTA for email,
 * no separate signup path — EmailAuthProvider decides existing-vs-new
 * internally. Social/현대 buttons are mock adapters (see authProviders.ts)
 * that resolve through the same signInWith() call.
 */
export function AuthScreen() {
  const { signInWith } = useApp2Session();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBusy = status === "loading";

  async function runSignIn(provider: AuthProviderAdapter, input?: EmailSignInInput) {
    if (isBusy) return;
    setStatus("loading");
    setPendingProviderId(provider.id);
    setErrorMessage(null);
    try {
      await signInWith(provider, input);
      setStatus("idle");
      setPendingProviderId(null);
    } catch (error) {
      setStatus("error");
      setPendingProviderId(null);
      setErrorMessage("로그인에 실패했습니다.\n잠시 후 다시 시도해주세요.");
      console.warn("[app2 auth]", error instanceof Error ? error.message : error);
    }
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    if (!email.trim() || !password.trim()) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    void runSignIn(EmailAuthProvider, { email, password });
  }

  return (
    <div className="a2-auth-screen">
      <div className="a2-auth-brand">
        <span className="a2-auth-logo" aria-hidden="true">🍯</span>
        <strong>꿀차지</strong>
        <span className="a2-auth-brand-en">HoneyCharge</span>
      </div>

      <form className="a2-auth-form" onSubmit={handleEmailSubmit} noValidate>
        <label htmlFor="a2-email">이메일</label>
        <input
          id="a2-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={isBusy}
        />

        <label htmlFor="a2-password">비밀번호</label>
        <input
          id="a2-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          disabled={isBusy}
        />

        {errorMessage && (
          <p className="a2-auth-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="a2-auth-cta" disabled={isBusy}>
          {isBusy && pendingProviderId === "email" ? "로그인 중..." : "로그인 / 간편가입"}
        </button>
      </form>

      <div className="a2-auth-divider" role="separator">
        <span>또는</span>
      </div>

      <div className="a2-auth-social">
        <button
          type="button"
          className="a2-social-btn a2-social-hyundai"
          disabled={isBusy}
          onClick={() => void runSignIn(HyundaiAuthProvider)}
        >
          <HyundaiMark size={20} />
          <span>{isBusy && pendingProviderId === "hyundai" ? "연결 중..." : "my현대 연결하기"}</span>
        </button>
        <button
          type="button"
          className="a2-social-btn a2-social-kakao"
          disabled={isBusy}
          onClick={() => void runSignIn(KakaoAuthProvider)}
        >
          <KakaoMark size={20} />
          <span>{isBusy && pendingProviderId === "kakao" ? "연결 중..." : "카카오톡으로 시작하기"}</span>
        </button>
        <button
          type="button"
          className="a2-social-btn a2-social-google"
          disabled={isBusy}
          onClick={() => void runSignIn(GoogleAuthProvider)}
        >
          <GoogleMark size={18} />
          <span>{isBusy && pendingProviderId === "google" ? "연결 중..." : "Google 계정으로 계속하기"}</span>
        </button>
        <button
          type="button"
          className="a2-social-btn a2-social-apple"
          disabled={isBusy}
          onClick={() => void runSignIn(AppleAuthProvider)}
        >
          <AppleMark size={16} />
          <span>{isBusy && pendingProviderId === "apple" ? "연결 중..." : "Apple로 로그인"}</span>
        </button>
      </div>

      <p className="a2-auth-demo-note">
        소셜 로그인·my현대 연결은 현재 데모 계정으로 진행됩니다. 실제 서비스 연동 전 시연용입니다.
      </p>
    </div>
  );
}
