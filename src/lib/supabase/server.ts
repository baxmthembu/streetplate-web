import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv, hasSupabaseEnv } from "./env";

export async function createClient() {
  if (!hasSupabaseEnv()) return null;

  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
          Object.entries(headersToSet).forEach(() => {
            // Server Components cannot set response headers. proxy.ts applies
            // the auth cache headers on real requests.
          });
        } catch {
          // Expected when called from a Server Component.
        }
      },
    },
  });
}
