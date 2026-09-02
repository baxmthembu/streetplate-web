"use client";

import { type ReactNode, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type RecoveryHashResult =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "session"; accessToken: string; refreshToken: string };

function singleValue(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : null;
}

export function parseRecoverySessionHash(hash: string): RecoveryHashResult {
  if (!hash.startsWith("#") || hash.length === 1) return { kind: "none" };

  const params = new URLSearchParams(hash.slice(1));
  const hasAuthValues =
    params.has("access_token") ||
    params.has("refresh_token") ||
    params.has("type") ||
    params.has("error");
  if (!hasAuthValues) return { kind: "none" };

  const type = singleValue(params, "type");
  const accessToken = singleValue(params, "access_token");
  const refreshToken = singleValue(params, "refresh_token");
  if (
    type !== "recovery" ||
    !accessToken ||
    accessToken.length < 32 ||
    accessToken.length > 4096 ||
    !refreshToken ||
    refreshToken.length < 8 ||
    refreshToken.length > 4096
  ) {
    return { kind: "invalid" };
  }

  return { kind: "session", accessToken, refreshToken };
}

export function RecoverySessionGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      const recovery = parseRecoverySessionHash(window.location.hash);
      if (recovery.kind !== "none") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      try {
        const supabase = createClient();
        if (recovery.kind === "invalid") {
          if (!cancelled) setStatus("invalid");
          return;
        }

        if (recovery.kind === "session") {
          const { error } = await supabase.auth.setSession({
            access_token: recovery.accessToken,
            refresh_token: recovery.refreshToken,
          });
          if (!cancelled) setStatus(error ? "invalid" : "ready");
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!cancelled) setStatus(!error && data.session ? "ready" : "invalid");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    }

    void prepareRecoverySession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <p className="form-message" role="status">
        Verifying your secure reset link…
      </p>
    );
  }

  if (status === "invalid") {
    return (
      <div className="auth-recovery-fallback">
        <p className="form-message" role="alert">
          This reset link is invalid or has expired.
        </p>
        <p>
          Enter your account email and complete the security check to receive a
          new link.
        </p>
        {fallback}
      </div>
    );
  }

  return children;
}
