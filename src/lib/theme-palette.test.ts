import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

const sharedMobilePalette = {
  primary: "#f97316",
  secondary: "#facc15",
  background: "#ffffff",
  surface: "#f3f4f6",
  "surface-alt": "#e9eaec",
  "text-primary": "#1f2937",
  "text-secondary": "#6b7280",
  "text-muted": "#9ca3af",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  info: "#2563eb",
  border: "#e5e7eb",
  "border-focus": "#f97316",
  "dark-background": "#111827",
  "dark-surface": "#1f2937",
  "dark-surface-alt": "#374151",
} as const;

const sharedSpacingScale = {
  "space-xs": "0.25rem",
  "space-s": "0.5rem",
  "space-m": "1rem",
  "space-l": "1.5rem",
  "space-xl": "2rem",
  "space-xxl": "3rem",
  "space-xxxl": "4rem",
  "touch-target": "3rem",
} as const;

const sharedTypographyScale = {
  "type-display-size": "2.25rem",
  "type-display-line": "2.75rem",
  "type-h1-size": "1.75rem",
  "type-h1-line": "2.125rem",
  "type-h2-size": "1.375rem",
  "type-h2-line": "1.75rem",
  "type-h3-size": "1.125rem",
  "type-h3-line": "1.5rem",
  "type-h4-size": "1rem",
  "type-h4-line": "1.375rem",
  "type-body-size": "0.9375rem",
  "type-body-line": "1.375rem",
  "type-body-small-size": "0.8125rem",
  "type-body-small-line": "1.125rem",
  "type-label-size": "0.875rem",
  "type-label-line": "1.25rem",
  "type-caption-size": "0.75rem",
  "type-caption-line": "1rem",
  "type-button-size": "0.9375rem",
  "type-button-line": "1.25rem",
  "type-price-size": "1.0625rem",
  "type-price-line": "1.375rem",
} as const;

const sharedShadowScale = {
  "shadow-none": "none",
  "shadow-xs": "0 0.03125rem 0.05rem rgba(0, 0, 0, 0.08)",
  "shadow-s": "0 0.0625rem 0.1rem rgba(0, 0, 0, 0.1)",
  "shadow-m": "0 0.125rem 0.2rem rgba(0, 0, 0, 0.12)",
  "shadow-l": "0 0.25rem 0.4rem rgba(0, 0, 0, 0.14)",
  "shadow-xl": "0 0.5rem 0.8rem rgba(0, 0, 0, 0.16)",
} as const;

describe("shared StreetPlate theme", () => {
  it("keeps the website palette aligned with the mobile applications", () => {
    for (const [token, value] of Object.entries(sharedMobilePalette)) {
      expect(css).toContain(`--${token}: ${value};`);
    }
  });

  it("keeps spacing, typography and elevation aligned with mobile", () => {
    const tokens = {
      ...sharedSpacingScale,
      ...sharedTypographyScale,
      ...sharedShadowScale,
    };

    for (const [token, value] of Object.entries(tokens)) {
      expect(css).toContain(`--${token}: ${value};`);
    }

    expect(css).toContain("font-family: var(--font-system);");
  });
});
