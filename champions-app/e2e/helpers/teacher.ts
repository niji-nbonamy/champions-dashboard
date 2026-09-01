import { expect, type Page } from "@playwright/test";

export const E2E_PASSWORD = "Test1234!";
export const E2E_STUDENT_NAME = "Marie Dupont";
export const E2E_SCHOOL_YEAR = "2025-2026";
export const E2E_MATRIX_LABEL = "Dictée 1";

export function uniqueTeacherEmail(): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${suffix}@example.com`;
}

export async function registerTeacher(
  page: Page,
  email: string,
  password = E2E_PASSWORD
): Promise<void> {
  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Créer un compte" })
  ).toBeVisible();

  const registrationBlocked = page.getByRole("alert").filter({
    hasText: /Inscription temporairement indisponible|reCAPTCHA/,
  });
  await expect(registrationBlocked).toHaveCount(0);

  const passwordInput = page.locator('input[name="password"]');
  const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
  await expect(passwordInput).toBeVisible();
  await expect(confirmPasswordInput).toBeVisible();

  await page.locator("#email").fill(email);
  await passwordInput.click();
  await passwordInput.pressSequentially(password);
  await confirmPasswordInput.click();
  await confirmPasswordInput.pressSequentially(password);

  const submitButton = page.getByRole("button", { name: "Créer mon compte" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  try {
    await expect(page).toHaveURL(/\/login\?registered=1/, { timeout: 15_000 });
  } catch {
    const formError = page.locator("form").getByRole("alert");
    const message = (await formError.textContent())?.trim() || "unknown error";
    throw new Error(`Registration failed on /register: ${message}`);
  }
}

export async function loginTeacher(
  page: Page,
  email: string,
  password = E2E_PASSWORD
): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await page.locator("#email").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/(dictations|onboarding\/class)/);
}

export async function createClass(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding\/class/);
  await page.locator("#school_year_label").fill(E2E_SCHOOL_YEAR);
  await page.getByRole("button", { name: "Créer ma classe" }).click();
  await expect(page).toHaveURL(/\/dictations/);
}

export async function addFirstStudent(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Élèves" }).click();
  await expect(page).toHaveURL(/\/students/);

  await page.locator("#display_name").fill(E2E_STUDENT_NAME);
  await page.getByRole("button", { name: "Ajouter un élève" }).click();

  await expect(page).toHaveURL(/\/onboarding\/year-start\?step=1/);
}

export async function completeYearStartWizard(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page).toHaveURL(/\/onboarding\/year-start\?step=2/);

  await page
    .getByRole("button", { name: "Assigner le niveau jaune" })
    .click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page).toHaveURL(/\/onboarding\/year-start\?step=3/);

  await page.getByRole("button", { name: "Ajouter une dictée" }).click();
  await page.getByLabel("Label dictée 1").fill(E2E_MATRIX_LABEL);
  await page.getByLabel("jaune dictée 1").fill("10");
  await page.getByLabel("vert dictée 1").fill("12");
  await page.getByLabel("violet dictée 1").fill("14");
  await page.getByLabel("or dictée 1").fill("16");
  await page.getByRole("button", { name: "Enregistrer la matrice" }).click();
  await expect(page.getByText("Matrice enregistrée.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Terminer la configuration" }).click();
  await expect(page).toHaveURL(/\/dictations/);
}

export async function createDictationWithoutSave(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Nouvelle dictée" }).click();
  await page.getByRole("button", { name: "Créer la dictée" }).click();
  await expect(page).toHaveURL(/\/dictations\/[0-9a-f-]+$/);

  const dictationUrl = page.url();
  const match = dictationUrl.match(/\/dictations\/([0-9a-f-]+)$/);
  if (!match?.[1]) {
    throw new Error(`Expected dictation id in URL, got ${dictationUrl}`);
  }

  return match[1];
}

export async function createAndSaveDictation(page: Page): Promise<void> {
  await createDictationWithoutSave(page);

  const saveButton = page.getByRole("button", { name: "Enregistrer" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByText("Dictée enregistrée.")).toBeVisible();
}

export const MOBILE_VIEWPORT = { width: 375, height: 667 };

export async function captureMobileDictationEntry(
  page: Page,
  studentName = E2E_STUDENT_NAME
): Promise<void> {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto("/dictations");

  await expect(
    page.getByRole("main", { name: "Hub dictée mobile" })
  ).toBeVisible();
  await page
    .getByRole("link", {
      name: `Saisir les erreurs pour ${E2E_MATRIX_LABEL}`,
    })
    .click();
  await expect(page).toHaveURL(/\/dictations\/[0-9a-f-]+\/mobile$/);
  await expect(page.getByText("1 restant")).toBeVisible();

  await page
    .getByRole("link", {
      name: `Saisir les erreurs pour ${studentName}`,
    })
    .click();
  await expect(page).toHaveURL(
    /\/dictations\/[0-9a-f-]+\/mobile\/[0-9a-f-]+$/
  );

  await page
    .getByRole("button", { name: new RegExp(`${studentName}, Conjugaison, 0 erreurs`) })
    .click();

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/\/dictations\/[0-9a-f-]+\/mobile$/);
  await expect(page.getByText("Tous les élèves sont saisis")).toBeVisible();
  await expect(
    page.getByRole("link", { name: `${studentName}, saisi` })
  ).toBeVisible();
}

export async function openDossierPresentation(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Élèves" }).click();
  await expect(page).toHaveURL(/\/students/);

  await page
    .getByRole("link", { name: `Dossier de ${E2E_STUDENT_NAME}` })
    .click();
  await expect(page).toHaveURL(/\/students\/[0-9a-f-]+$/);
  await expect(page.getByTestId("global-success-curve")).toBeVisible();

  await page.getByRole("link", { name: "RDV parents" }).click();
  await expect(page).toHaveURL(/\/students\/[0-9a-f-]+\/present$/);
  await expect(page.getByTestId("presentation-mode-dialog")).toBeVisible();
  await expect(page.getByTestId("presentation-highlights")).toBeVisible();

  await page.getByRole("button", { name: "Fermer" }).click();
  await expect(page).toHaveURL(/\/students\/[0-9a-f-]+$/);
  await expect(page.getByRole("link", { name: "RDV parents" })).toBeVisible();
}

export async function expectDashboardTabs(page: Page): Promise<void> {
  for (const tab of ["Dictées", "Élèves", "Config", "Alertes"]) {
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", {
        name: tab,
      })
    ).toBeVisible();
  }
}
