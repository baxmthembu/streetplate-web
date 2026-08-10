const internalOrigin = "https://streetplate.local";

export function getSafeInternalPath(
  value: string | null | undefined,
): string | null {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }

  try {
    const url = new URL(value, internalOrigin);
    if (url.origin !== internalOrigin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/account",
): string {
  return getSafeInternalPath(value) ?? fallback;
}
