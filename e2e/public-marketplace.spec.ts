import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function chooseEssentialCookies(page: Page) {
  const button = page.getByRole("button", { name: "Essential only" });
  if ((await button.count()) > 0 && (await button.isVisible()))
    await button.click();
}

async function expectFoodImagesLoaded(page: Page) {
  const images = page.locator(".category-image, .food-card-image");
  await expect.poll(() => images.count()).toBeGreaterThan(0);

  for (const selector of [".category-grid img", ".vendor-grid img"]) {
    const image = page.locator(selector).first();
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          image.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth,
          ),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  }
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
  await expectFoodImagesLoaded(page);

  await page.goto("/discover");
  const firstVendorName = await page
    .locator(".vendor-grid-results .vendor-card h3")
    .first()
    .innerText();
  const marketplaceSearch = page.getByRole("textbox", {
    name: "Search vendors or meals",
  });
  await marketplaceSearch.fill(firstVendorName);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/(?:\?|&)q=/);
  await expect(
    page.getByRole("heading", { name: firstVendorName }),
  ).toBeVisible();
});

test("cart persists and exposes the secure checkout boundary", async ({
  page,
}) => {
  await page.goto("/discover");
  await chooseEssentialCookies(page);
  const vendorLinks = page.locator(
    '.vendor-grid-results .vendor-card a[href^="/vendors/"]',
  );
  let mealName = "";
  for (let index = 0; index < (await vendorLinks.count()); index += 1) {
    const href = await vendorLinks.nth(index).getAttribute("href");
    if (!href) continue;
    await page.goto(href);
    const addButton = page
      .getByRole("button", { name: /^Add .+ to cart$/ })
      .first();
    if ((await addButton.count()) === 0) continue;
    mealName =
      (await addButton.getAttribute("aria-label"))
        ?.replace(/^Add /, "")
        .replace(/ to cart$/, "") ?? "";
    await addButton.click();
    break;
  }
  test.skip(
    !mealName,
    "The current marketplace fixture has no available menu item.",
  );
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: mealName })).toBeVisible();
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
  test.setTimeout(120_000);
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
  expect([200, 429]).toContain(health.status());
  if (health.ok()) {
    await expect(health.json()).resolves.toMatchObject({
      status: "ok",
      service: "streetplate-web",
    });
  } else {
    expect(health.headers()["retry-after"]).toBeTruthy();
  }

  const readiness = await request.get("/api/readiness");
  expect([200, 429, 503]).toContain(readiness.status());
  if (readiness.status() !== 429) {
    await expect(readiness.json()).resolves.toMatchObject({
      checks: {
        configuration: expect.any(Boolean),
        api: expect.any(Boolean),
        auth: expect.any(Boolean),
      },
    });
  } else {
    expect(readiness.headers()["retry-after"]).toBeTruthy();
  }

  const home = await request.get("/");
  expect(home.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
});
