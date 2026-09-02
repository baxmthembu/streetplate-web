const requiredProductionVariables = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SOCKET_URL",
  "STREETPLATE_API_URL",
] as const;

type Environment = Record<string, string | undefined>;

function isHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function productionReadiness(environment: Environment = process.env) {
  const missing = requiredProductionVariables.filter(
    (name) => !environment[name]?.trim(),
  );
  const invalidUrls = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SOCKET_URL",
    "STREETPLATE_API_URL",
  ].filter(
    (name) => environment[name]?.trim() && !isHttpsUrl(environment[name]),
  );

  return {
    ready: missing.length === 0 && invalidUrls.length === 0,
    missing,
    invalidUrls,
  };
}

export function normalizeApiBase(value: string) {
  const base = value.replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}
