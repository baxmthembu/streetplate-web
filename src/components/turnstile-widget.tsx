"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import type { TurnstileAction } from "@/lib/turnstile";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWidgetId = string;

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  cData?: string;
  appearance: "always";
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "unsupported-callback": () => void;
  "response-field": false;
  size: "flexible";
  theme: "light";
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
  reset: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  action: TurnstileAction;
  cData?: string;
  onTokenChange?: (token: string) => void;
  onVerifiedChange: (verified: boolean) => void;
  resetSignal: object;
};

export function TurnstileWidget({
  action,
  cData,
  onTokenChange,
  onVerifiedChange,
  resetSignal,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const initialResetSignalRef = useRef(resetSignal);
  const [token, setToken] = useState("");
  const [loadError, setLoadError] = useState(false);

  const updateToken = useCallback(
    (nextToken: string) => {
      setToken(nextToken);
      onVerifiedChange(Boolean(nextToken));
      onTokenChange?.(nextToken);
    },
    [onTokenChange, onVerifiedChange],
  );

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      ...(cData ? { cData } : {}),
      appearance: "always",
      callback: updateToken,
      "error-callback": () => {
        setLoadError(true);
        updateToken("");
      },
      "expired-callback": () => updateToken(""),
      "unsupported-callback": () => {
        setLoadError(true);
        updateToken("");
      },
      "response-field": false,
      size: "flexible",
      theme: "light",
    });
  }, [action, cData, siteKey, updateToken]);

  useEffect(() => {
    renderWidget();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (initialResetSignalRef.current === resetSignal) return;
    initialResetSignalRef.current = resetSignal;

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      updateToken("");
    }
  }, [resetSignal, updateToken]);

  if (!siteKey) {
    return (
      <p className="turnstile-message" role="alert">
        Security verification is not configured. Please try again later.
      </p>
    );
  }

  return (
    <div className="turnstile-field">
      <Script
        id="cloudflare-turnstile"
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={renderWidget}
        onReady={renderWidget}
        onError={() => setLoadError(true)}
      />
      <div
        ref={containerRef}
        className="turnstile-widget"
        aria-label="Security verification"
      />
      <input type="hidden" name="cf-turnstile-response" value={token} />
      {loadError && (
        <p className="turnstile-message" role="alert">
          The security check could not load. Check your connection and try
          again.
        </p>
      )}
    </div>
  );
}
