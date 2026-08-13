"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseCookieOptions, getSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey, {
    cookieOptions: getSupabaseCookieOptions(),
  });
}
