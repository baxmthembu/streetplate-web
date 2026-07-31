import "server-only";

import { createClient } from "@/lib/supabase/server";

export class StreetPlateApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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

async function responseMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      message?: string;
      errors?: Array<{ msg?: string }>;
    };
    return (
      payload.error ??
      payload.message ??
      payload.errors?.[0]?.msg ??
      "StreetPlate could not complete that request."
    );
  } catch {
    return "StreetPlate could not complete that request.";
  }
}

export async function getVerifiedAccessToken(): Promise<string> {
  const supabase = await createClient();
  if (!supabase) {
    throw new StreetPlateApiError("Authentication is not configured.", 503);
  }

  const { data: claimData, error: claimError } =
    await supabase.auth.getClaims();
  if (claimError || !claimData?.claims?.sub) {
    throw new StreetPlateApiError("Sign in to continue.", 401);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
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
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new StreetPlateApiError(
      await responseMessage(response),
      response.status,
    );
  }
  return (await response.json()) as T;
}

export async function streetPlatePublicApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new StreetPlateApiError(
      await responseMessage(response),
      response.status,
    );
  }
  return (await response.json()) as T;
}
