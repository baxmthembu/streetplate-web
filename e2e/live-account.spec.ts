import { expect, test } from "@playwright/test";

const stagingAccounts = [
  {
    role: "customer",
    email: process.env.E2E_CUSTOMER_EMAIL,
    password: process.env.E2E_CUSTOMER_PASSWORD,
    next: "/account",
    destination: /\/account(?:[/?#]|$)/,
    marker: { kind: "heading", name: /Hello,/ },
  },
  {
    role: "vendor",
    email: process.env.E2E_VENDOR_EMAIL,
    password: process.env.E2E_VENDOR_PASSWORD,
    next: "/vendor",
    destination: /\/vendor(?:[/?#]|$)/,
    marker: { kind: "link", name: "Overview" },
  },
  {
    role: "driver",
    email: process.env.E2E_DRIVER_EMAIL,
    password: process.env.E2E_DRIVER_PASSWORD,
    next: "/driver",
    destination: /\/driver(?:[/?#]|$)/,
    marker: { kind: "link", name: "Drive" },
  },
] as const;

for (const account of stagingAccounts) {
  test(`an existing ${account.role} can reach the correct workspace`, async ({
    page,
  }) => {
    test.skip(
      !account.email || !account.password,
      `Provide dedicated staging ${account.role} credentials to run this live journey.`,
    );

    await page.goto(`/sign-in?next=${encodeURIComponent(account.next)}`);
    await page.getByLabel("Email address").fill(account.email!);
    await page.getByLabel("Password").fill(account.password!);

    const signIn = page.getByRole("button", { name: "Sign in" });
    await expect(signIn).toBeEnabled({ timeout: 20_000 });
    await signIn.click();

    await expect(page).toHaveURL(account.destination);
    const marker =
      account.marker.kind === "heading"
        ? page.getByRole("heading", { name: account.marker.name })
        : page.getByRole("link", { name: account.marker.name });
    await expect(marker).toBeVisible();
  });
}
