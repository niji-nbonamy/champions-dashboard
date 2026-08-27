import { expect, test } from "@playwright/test";

test.describe("public auth smoke", () => {
  test("login page renders the teacher sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
    await expect(
      page.getByText("Connectez-vous avec votre compte enseignant.")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  });

  test("register page renders the teacher sign-up form", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Créer un compte" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible();
  });

  test("redirects unauthenticated dashboard access to login", async ({ page }) => {
    await page.goto("/dictations");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });
});
