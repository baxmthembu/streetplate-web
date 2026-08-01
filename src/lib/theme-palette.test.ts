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

describe("shared StreetPlate theme", () => {
  it("keeps the website palette aligned with the mobile applications", () => {
    for (const [token, value] of Object.entries(sharedMobilePalette)) {
      expect(css).toContain(`--${token}: ${value};`);
    }
  });
});
