import { NextResponse } from "next/server";

import {
  normalizeApiBase,
  productionReadiness,
} from "@/lib/production-readiness";

export const dynamic = "force-dynamic";

async function reachable(url: string, headers?: HeadersInit) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const configuration = productionReadiness();
  const apiUrl = process.env.STREETPLATE_API_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const [api, auth] = await Promise.all([
    apiUrl
      ? reachable(`${normalizeApiBase(apiUrl)}/health`)
      : Promise.resolve(false),
    supabaseUrl && publishableKey
      ? reachable(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
          apikey: publishableKey,
        })
      : Promise.resolve(false),
  ]);
  const ready = configuration.ready && api && auth;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      checks: { configuration: configuration.ready, api, auth },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
