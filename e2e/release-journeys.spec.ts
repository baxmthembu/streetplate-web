import { expect, test, type Page } from "@playwright/test";

async function chooseEssentialCookies(page: Page) {
  const button = page.getByRole("button", { name: "Essential only" });
  await button.waitFor({ state: "visible", timeout: 2_000 }).catch(() => {});
  if (await button.isVisible()) await button.click();
}

async function openVendorWithMenu(page: Page) {
  await page.goto("/discover");
  await chooseEssentialCookies(page);

  const vendorLinks = page.locator(
    '.vendor-grid-results .vendor-card a[href^="/vendors/"]',
  );
  const hrefs = await vendorLinks.evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href)),
  );

  expect(
    hrefs.length,
    "Discovery should list at least one vendor",
  ).toBeGreaterThan(0);

  for (const href of hrefs) {
    await page.goto(href, { waitUntil: "domcontentloaded" });
    const addButtons = page.getByRole("button", {
      name: /^Add .+ to cart$/,
    });
    if ((await addButtons.count()) > 0) {
      return addButtons.first();
    }
  }

  return null;
}

async function expectSignedOutBoundary(page: Page, destination: string) {
  await expect(
    page.getByRole("heading", { name: "Sign in to StreetPlate" }),
  ).toBeVisible({ timeout: 30_000 });

  const joinHref = await page
    .getByRole("link", { name: "Need an account?" })
    .getAttribute("href");
  expect(
    joinHref,
    "The sign-in boundary should retain a join destination",
  ).toBeTruthy();
  expect(new URL(joinHref!, page.url()).searchParams.get("next")).toBe(
    destination,
  );
}

test("a category deep link applies the matching food-type filter", async ({
  page,
}) => {
  await page.goto("/discover?category=kota");
  await chooseEssentialCookies(page);

  await expect(page.getByRole("button", { name: "Kotas" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Food type", { exact: true })).toHaveValue(
    "kotas",
  );
  await expect(
    page.getByLabel("1 active filters", { exact: true }),
  ).toBeVisible();
});

test("vendor menu search filters available meals and announces no matches", async ({
  page,
}) => {
  const firstAddButton = await openVendorWithMenu(page);
  if (!firstAddButton) {
    test.skip(
      true,
      "Requires at least one available menu item in the target environment.",
    );
    return;
  }
  const firstMealName = (await firstAddButton.getAttribute("aria-label"))
    ?.replace(/^Add /, "")
    .replace(/ to cart$/, "");
  expect(
    firstMealName,
    "An add-to-cart button should name its meal",
  ).toBeTruthy();

  const search = page.getByRole("searchbox", { name: "Search this menu" });
  await page.waitForTimeout(500);
  await search.fill(firstMealName!);
  await expect(
    page.getByRole("button", { name: `Add ${firstMealName} to cart` }),
  ).toBeVisible();

  await search.fill("zzzz-e2e-no-menu-item-9f94");
  await expect(
    page.getByRole("heading", {
      name: "No menu items match your search.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Add .+ to cart$/ }),
  ).toHaveCount(0);
});

test("cart quantity updates the subtotal and checkout requires sign-in", async ({
  page,
}) => {
  const mealName = "E2E Test Plate";
  await page.addInitScript(
    ({ storageKey, cart }) =>
      window.localStorage.setItem(storageKey, JSON.stringify(cart)),
    {
      storageKey: "streetplate-cart:v1",
      cart: [
        {
          id: "e2e-test-meal",
          vendorId: "e2e-test-vendor",
          vendorSlug: "e2e-test-vendor",
          vendorName: "E2E Test Kitchen",
          name: mealName,
          description: "A deterministic browser-only cart fixture.",
          category: "Traditional",
          accent: "gold",
          imageUrl: "/food/pap-beef-stew.png",
          price: 42.5,
          quantity: 1,
          notes: "",
        },
      ],
    },
  );
  await page.goto("/cart");
  await chooseEssentialCookies(page);

  const subtotal = page
    .locator(".cart-summary > div")
    .filter({ hasText: "Subtotal" })
    .locator("strong");
  const originalSubtotal = await subtotal.innerText();
  const quantity = page.locator(
    `.quantity-control[aria-label="${mealName} quantity"]`,
  );

  await quantity
    .getByRole("button", { name: `Increase ${mealName} quantity` })
    .click();
  await expect(quantity.locator("span")).toHaveText("2");
  await expect(subtotal).not.toHaveText(originalSubtotal);

  await quantity
    .getByRole("button", { name: `Decrease ${mealName} quantity` })
    .click();
  await expect(quantity.locator("span")).toHaveText("1");
  await expect(subtotal).toHaveText(originalSubtotal);

  await expect(
    page.getByRole("link", { name: "Continue to checkout" }),
  ).toHaveAttribute("href", "/checkout");
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await expectSignedOutBoundary(page, "/checkout");
});

test("protected vendor and driver workspaces preserve their requested destination", async ({
  page,
}) => {
  await page.goto("/vendor", { waitUntil: "domcontentloaded" });
  await expectSignedOutBoundary(page, "/vendor");

  await page.goto("/driver", { waitUntil: "domcontentloaded" });
  await expectSignedOutBoundary(page, "/driver");
});

test("auth callback failures show safe, actionable messages", async ({
  page,
}) => {
  await page.goto("/sign-in?error=callback");
  await chooseEssentialCookies(page);
  await expect(page.locator(".form-message[role=alert]")).toContainText(
    "We could not complete that sign-in link",
  );

  await page.goto("/sign-in?error=rate_limited");
  await expect(page.locator(".form-message[role=alert]")).toContainText(
    "Please wait a moment and try again",
  );
});
