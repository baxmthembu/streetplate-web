import { describe, expect, it } from "vitest";

import { normalizeApiBase, productionReadiness } from "./production-readiness";

const completeEnvironment = {
  NEXT_PUBLIC_SITE_URL: "https://streetplate.example",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  NEXT_PUBLIC_SOCKET_URL: "https://api.streetplate.example",
  STREETPLATE_API_URL: "https://api.streetplate.example",
};

describe("production readiness", () => {
  it("accepts a complete HTTPS configuration", () => {
    expect(productionReadiness(completeEnvironment)).toEqual({
      ready: true,
      missing: [],
      invalidUrls: [],
    });
  });

  it("reports missing values without returning their contents", () => {
    const result = productionReadiness({});
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("STREETPLATE_API_URL");
  });

  it("rejects non-HTTPS production endpoints", () => {
    const result = productionReadiness({
      ...completeEnvironment,
      NEXT_PUBLIC_SITE_URL: "http://streetplate.example",
    });
    expect(result.invalidUrls).toEqual(["NEXT_PUBLIC_SITE_URL"]);
  });

  it("normalizes the existing API base once", () => {
    expect(normalizeApiBase("https://api.example/api/")).toBe(
      "https://api.example/api",
    );
    expect(normalizeApiBase("https://api.example")).toBe(
      "https://api.example/api",
    );
  });
});
