"use client";

import { useCallback, useMemo, useState } from "react";

import { TurnstileWidget } from "@/components/turnstile-widget";
import type { TurnstileAction } from "@/lib/turnstile";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

type MobileTurnstileBridgeProps = {
  action: TurnstileAction;
  app: "customer" | "vendor" | "driver";
};

export function MobileTurnstileBridge({
  action,
  app,
}: MobileTurnstileBridgeProps) {
  const [resetSignal] = useState({});
  const cData = useMemo(() => `mobile_${app}`, [app]);

  const sendToken = useCallback(
    (token: string) => {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: "turnstile",
          status: token ? "success" : "expired",
          action,
          token,
        }),
      );
    },
    [action],
  );

  return (
    <main
      style={{
        alignItems: "center",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: 8,
      }}
    >
      <div style={{ maxWidth: 360, width: "100%" }}>
        <TurnstileWidget
          action={action}
          cData={cData}
          onTokenChange={sendToken}
          onVerifiedChange={() => undefined}
          resetSignal={resetSignal}
        />
      </div>
    </main>
  );
}
