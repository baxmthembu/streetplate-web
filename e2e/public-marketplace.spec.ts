import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function chooseEssentialCookies(page: Page) {
  const button = page.getByRole("button", { name: "Essential only" });
  if (await button.isVisible()) await button.click();
}

test("home and discovery remain usable across supported viewports", async ({
  page,
}) => {
  await page.goto("/");
  await chooseEssentialCookies(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Local food",
  );
  await expect(page.locator("html")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("html").evaluate((element) => element.clientWidth),
  );

  await page.goto("/discover");
  const marketplaceSearch = page.getByRole("textbox", {
    name: "Search vendors and meals",
  });
  await marketplaceSearch.fill("pap");
  await expect(page.getByRole("heading", { name: "1 vendor" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Pap & Beef Stew" }),
  ).toBeVisible();
});

test("cart persists and exposes the secure checkout boundary", async ({
  page,
}) => {
  await page.goto("/discover");
  await chooseEssentialCookies(page);
  await page
    .getByRole("textbox", { name: "Search vendors and meals" })
    .fill("pap");
  await page
    .getByRole("button", { name: "Add Pap & Beef Stew to cart" })
    .click();
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Pap & Beef Stew" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue to checkout" }),
  ).toBeVisible();
  await expect(
    page.getByText("backend rechecks item availability", { exact: false }),
  ).toBeVisible();
});

test("public pages have no serious automated accessibility violations", async ({
  page,
}) => {
  for (const path of ["/", "/discover", "/join", "/legal/privacy"]) {
    await page.goto(path);
    await chooseEssentialCookies(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(
      serious,
      `${path}: ${serious.map((item) => item.id).join(", ")}`,
    ).toEqual([]);
  }
});

test("health, readiness and browser security headers are explicit", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    service: "streetplate-web",
  });

  const readiness = await request.get("/api/readiness");
  expect([200, 503]).toContain(readiness.status());
  await expect(readiness.json()).resolves.toMatchObject({
    checks: {
      configuration: expect.any(Boolean),
      api: expect.any(Boolean),
      auth: expect.any(Boolean),
    },
  });

  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
});
