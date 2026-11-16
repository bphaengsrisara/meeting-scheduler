import { expect, test, type Page } from "@playwright/test";

// Each run signs up a new user, so tests never depend on earlier data.
const newEmail = () => `e2e-${crypto.randomUUID()}@example.com`;
const password = "a long enough passphrase";

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Full Name (optional)").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(
    page.getByRole("heading", { name: "Upcoming Meetings" }),
  ).toBeVisible();
}

test("a signed-out visit goes to the login page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Candidate Meeting Scheduler" }),
  ).toBeVisible();
});

test("sign up, log out, then log in", async ({ page }) => {
  const email = newEmail();
  await signUp(page, "Jane Doe", email);
  await expect(page.getByText("Jane Doe")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("not the password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(
    page.getByText("Email or password is incorrect. Check both and try again."),
  ).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(
    page.getByRole("heading", { name: "Upcoming Meetings" }),
  ).toBeVisible();
});

test("sign-up shows its errors after Create Account is pressed", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(page.getByText("Use at least 15 characters.")).toBeVisible();
});

test("an email that is taken offers the login page", async ({
  page,
  browser,
}) => {
  const email = newEmail();
  await signUp(page, "", email);

  const other = await browser.newPage();
  await other.goto("/signup");
  await other.getByLabel("Email").fill(email);
  await other.getByLabel("Password", { exact: true }).fill(password);
  await other.getByRole("button", { name: "Create Account" }).click();

  await expect(
    other.getByText("An account with this email already exists."),
  ).toBeVisible();
  await expect(
    other.getByRole("link", { name: "Log in instead" }),
  ).toBeVisible();
});

test("a guest sees the guest notice and confirms before logging out", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as Guest" }).click();

  await expect(page.getByText("You are using a guest account.")).toBeVisible();
  await expect(page.getByText("Guest", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(
    page.getByRole("heading", { name: "Log Out of the Guest Account?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay Signed In" }).click();
  await expect(page.getByText("You are using a guest account.")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
