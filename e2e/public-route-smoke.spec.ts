import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  ["/", "Local food, delivered from your community."],
  ["/discover", "Your neighbourhood menu"],
  ["/cart", "Your cart"],
  ["/sign-in", "Sign in to StreetPlate"],
  ["/join", "Join StreetPlate"],
  ["/forgot-password", "Reset your password"],
  ["/reset-password", "Choose a new password"],
  ["/become-a-vendor", "Put your local food business on the map."],
  ["/become-a-driver", "Help local food travel further."],
  ["/legal/privacy", "Privacy Policy"],
  ["/legal/terms", "Terms and Conditions"],
  ["/legal/cookies", "Cookie Policy"],
  ["/legal/refunds", "Refund and Cancellation Policy"],
  ["/legal/vendor-terms", "Vendor Terms"],
  ["/legal/driver-terms", "Delivery Partner Terms"],
] as const;

async function chooseEssentialCookies(page: Page) {
  const button = page.getByRole("button", { name: "Essential only" });
  await button.waitFor({ state: "visible", timeout: 2_000 }).catch(() => {});
  if (await button.isVisible()) await button.click();
}

test("every public entry route renders without viewport overflow", async ({
  page,
}) => {
  test.setTimeout(120_000);

  for (const [path, heading] of publicRoutes) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} should return a successful page`).toBe(
      200,
    );
    await chooseEssentialCookies(page);
    await expect(
      page.getByRole("heading", { level: 1, name: heading }),
      `${path} should render its primary heading`,
    ).toBeVisible();

    const viewport = await page.locator("html").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(
      viewport.scrollWidth,
      `${path} should not overflow horizontally`,
    ).toBeLessThanOrEqual(viewport.clientWidth + 1);
  }
});

test("registration forms expose every required field and stay CAPTCHA gated", async ({
  page,
}) => {
  for (const registration of [
    {
      path: "/join",
      fields: ["name", "email", "phone", "password", "terms"],
    },
    {
      path: "/become-a-vendor#application",
      fields: [
        "name",
        "email",
        "phone",
        "description",
        "address",
        "password",
        "terms",
      ],
    },
    {
      path: "/become-a-driver#application",
      fields: ["name", "email", "phone", "password", "terms"],
    },
  ]) {
    await page.goto(registration.path, { waitUntil: "domcontentloaded" });
    await chooseEssentialCookies(page);
    const form = page.locator("form.auth-form");

    for (const field of registration.fields) {
      await expect(
        form.locator(`[name="${field}"]`),
        `${registration.path} should contain ${field}`,
      ).toHaveAttribute("required", "");
    }

    await expect(
      form.getByRole("button", { name: "Create account" }),
    ).toBeDisabled();
    await expect(
      form.evaluate((element) => (element as HTMLFormElement).checkValidity()),
    ).resolves.toBe(false);
  }
});

test("password recovery forms remain verification gated", async ({ page }) => {
  await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
  await chooseEssentialCookies(page);
  await expect(page.getByLabel("Email address")).toHaveAttribute(
    "required",
    "",
  );
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeDisabled();

  await page.goto("/reset-password", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Email address")).toHaveAttribute(
    "required",
    "",
  );
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeDisabled();
});

test("unknown legal documents fail closed with not-found UI and noindex", async ({
  page,
}) => {
  const response = await page.goto("/legal/not-a-real-document", {
    waitUntil: "domcontentloaded",
  });
  // Next.js can stream a notFound() boundary after the response has started,
  // which keeps HTTP 200 while adding the required noindex directive.
  expect([200, 404]).toContain(response?.status());
  await expect(
    page.getByRole("heading", { name: "That plate is not on the menu" }),
  ).toBeVisible();
  const robotsMeta = page.locator('meta[name="robots"]');
  const directives = await robotsMeta.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("content") ?? ""),
  );
  expect(directives.length).toBeGreaterThan(0);
  expect(directives.every((value) => /noindex/i.test(value))).toBe(true);
});
