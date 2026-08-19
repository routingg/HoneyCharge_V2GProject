"use client";

import { App2Shell } from "@/components/app2/App2Shell";
import { App2SessionProvider, useApp2Session } from "@/components/app2/auth/AuthProvider";
import { AuthScreen } from "@/components/app2/auth/AuthScreen";
import { PermissionScreen } from "@/components/app2/onboarding/PermissionScreen";

/** §23 auth state flow: unauthenticated → (login/auto-signup) → onboarding? → main. */
function App2Gate() {
  const { status } = useApp2Session();
  if (status === "unauthenticated") return <AuthScreen />;
  if (status === "onboarding") return <PermissionScreen />;
  return <App2Shell />;
}

export function App2() {
  return (
    <div className="hc-app2">
      <div className="a2-frame">
        <App2SessionProvider>
          <App2Gate />
        </App2SessionProvider>
      </div>
    </div>
  );
}
