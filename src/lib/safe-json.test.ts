import { describe, expect, it } from "vitest";

import { safeJsonForHtml } from "./safe-json";

describe("safeJsonForHtml", () => {
  it("prevents user content from terminating an inline script", () => {
    const serialized = safeJsonForHtml({
      description: '</script><script>alert("xss")</script>',
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(JSON.parse(serialized)).toEqual({
      description: '</script><script>alert("xss")</script>',
    });
  });

  it("escapes HTML-significant and JavaScript separator characters", () => {
    const serialized = safeJsonForHtml({ value: "<&>\u2028\u2029" });

    expect(serialized).toContain("\\u003c\\u0026\\u003e\\u2028\\u2029");
  });
});
