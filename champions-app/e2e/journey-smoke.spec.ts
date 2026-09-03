import { expect, test } from "@playwright/test";

import {
  addFirstStudent,
  completeYearStartWizard,
  createAndSaveDictation,
  createClass,
  expectDashboardTabs,
  loginTeacher,
  openStudentSheetPresentation,
  registerTeacher,
  uniqueTeacherEmail,
} from "./helpers/teacher";

test.describe.configure({ mode: "serial" });

test.describe("teacher pilot journey smoke", () => {
  test.setTimeout(120_000);

  test("register → onboarding → dictation save → student sheet presentation", async ({
    page,
  }) => {
    const email = uniqueTeacherEmail();

    await registerTeacher(page, email);
    await loginTeacher(page, email);
    await createClass(page);
    await expectDashboardTabs(page);
    await addFirstStudent(page);
    await completeYearStartWizard(page);
    await expectDashboardTabs(page);
    await createAndSaveDictation(page);
    await openStudentSheetPresentation(page);
  });
});
