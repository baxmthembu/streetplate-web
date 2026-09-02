import "server-only";

import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 8_000;
const API_TIMEOUT_MS = 12_000;

export class StreetPlateApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly field?: string,
  ) {
    super(message);
  }
}

function apiBaseUrl(): string {
  const configured = process.env.STREETPLATE_API_URL?.replace(/\/$/, "");
  if (!configured) {
    throw new StreetPlateApiError(
      "The StreetPlate API is not configured in this environment.",
      503,
    );
  }
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

async function responseError(
  response: Response,
): Promise<{ message: string; code?: string; field?: string }> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      code?: string;
      errors?: Array<{
        msg?: string;
        path?: string;
        param?: string;
        fields?: Array<{ path?: string }>;
      }>;
    };
    const validationError = payload.errors?.[0];
    return {
      message:
        payload.error ??
        payload.message ??
        validationError?.msg ??
        "StreetPlate could not complete that request.",
      code: payload.code,
      field:
        validationError?.path ??
        validationError?.param ??
        validationError?.fields?.[0]?.path,
    };
  } catch {
    return { message: "StreetPlate could not complete that request." };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new StreetPlateApiError(
                "StreetPlate is taking too long to respond. Please try again.",
                503,
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function requestSignal(signal?: AbortSignal | null) {
  const timeoutSignal = AbortSignal.timeout(API_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function apiFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new StreetPlateApiError(
      "The StreetPlate service is temporarily unavailable. Please try again.",
      503,
    );
  }
}

export async function getVerifiedAccessToken(): Promise<string> {
  const supabase = await createClient();
  if (!supabase) {
    // Protected routes must fail at the authentication boundary even when a
    // non-production environment has no Supabase credentials. Operational
    // readiness remains fail-closed in /api/readiness.
    throw new StreetPlateApiError("Sign in to continue.", 401);
  }

  const { data: claimData, error: claimError } = await withTimeout(
    supabase.auth.getClaims(),
    AUTH_TIMEOUT_MS,
  );
  if (claimError || !claimData?.claims?.sub) {
    throw new StreetPlateApiError("Sign in to continue.", 401);
  }

  const {
    data: { session },
  } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
  if (!session?.access_token) {
    throw new StreetPlateApiError("Your session has expired.", 401);
  }
  return session.access_token;
}

export async function streetPlateApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getVerifiedAccessToken();
  const isFormData = init.body instanceof FormData;
  const response = await apiFetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    signal: requestSignal(init.signal),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const error = await responseError(response);
    throw new StreetPlateApiError(
      error.message,
      response.status,
      error.code,
      error.field,
    );
  }
  return (await response.json()) as T;
}

export async function streetPlatePublicApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await apiFetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    signal: requestSignal(init.signal),
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const error = await responseError(response);
    throw new StreetPlateApiError(
      error.message,
      response.status,
      error.code,
      error.field,
    );
  }
  return (await response.json()) as T;
}
