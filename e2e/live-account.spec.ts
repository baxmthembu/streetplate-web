import { expect, test } from "@playwright/test";

const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;

test("an existing customer can reach the shared account", async ({ page }) => {
  test.skip(
    !email || !password,
    "Provide dedicated staging customer credentials to run this read-only live journey.",
  );
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
});
