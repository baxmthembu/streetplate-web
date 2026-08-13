const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return value.length === 36 && uuidPattern.test(value);
}

export function isSafeAuthCode(value: string | null): value is string {
  return Boolean(
    value &&
    value.length >= 16 &&
    value.length <= 4_096 &&
    !/[\u0000-\u001f\u007f]/.test(value),
  );
}

export function safeSiteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (
        url.protocol === "https:" ||
        (url.protocol === "http:" &&
          (url.hostname === "localhost" || url.hostname === "127.0.0.1"))
      ) {
        return url.origin;
      }
    } catch {
      // Fall through to the request origin in development.
    }
  }

  const requestUrl = new URL(request.url);
  if (
    process.env.NODE_ENV !== "production" &&
    (requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1")
  ) {
    return requestUrl.origin;
  }

  // Avoid reflecting an attacker-controlled Host header in production.
  return "https://streetplate.co.za";
}
