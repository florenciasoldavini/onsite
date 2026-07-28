import { expect, test } from "@playwright/test";

test("validates the public sign-in form without exposing provider errors", async ({
  page
}) => {
  await page.goto("/sign-in");

  await expect(page.getByText("Welcome Back", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByText("Invalid email address")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();
});

test("navigates between public account-entry routes", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByText("Create an Account").click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(
    page.getByText("Create Account", { exact: true }).first()
  ).toBeVisible();

  await page.goto("/sign-in");
  await page.getByText("Forgot?").click();
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(
    page.getByText("Reset Your Password", { exact: true })
  ).toBeVisible();
});

test("protects authenticated routes when no session exists", async ({
  page
}) => {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText("Welcome Back", { exact: true })).toBeVisible();
});
