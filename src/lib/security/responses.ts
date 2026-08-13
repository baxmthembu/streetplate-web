import { NextResponse } from "next/server";

import type { RateLimitResult } from "./rate-limit";
import { rateLimitHeaders } from "./rate-limit";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function secureJson<T>(
  body: T,
  init: ResponseInit = {},
): NextResponse<T> {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(noStoreHeaders)) {
    headers.set(name, value);
  }
  headers.set("X-Content-Type-Options", "nosniff");

  return NextResponse.json(body, { ...init, headers });
}

export function tooManyRequests(result: RateLimitResult) {
  return secureJson(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

export function secureRedirect(destination: URL, status: 303 | 307 = 303) {
  const response = NextResponse.redirect(destination, status);
  for (const [name, value] of Object.entries(noStoreHeaders)) {
    response.headers.set(name, value);
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function withRateLimitHeaders<T extends Response>(
  response: T,
  result: RateLimitResult,
): T {
  for (const [name, value] of Object.entries(rateLimitHeaders(result))) {
    response.headers.set(name, value);
  }
  return response;
}
