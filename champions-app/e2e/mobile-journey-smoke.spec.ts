import { expect, test } from "@playwright/test";

import {
  addFirstStudent,
  captureMobileDictationEntry,
  completeYearStartWizard,
  createClass,
  createDictationWithoutSave,
  expectDashboardTabs,
  loginTeacher,
  registerTeacher,
  uniqueTeacherEmail,
} from "./helpers/teacher";

test.describe.configure({ mode: "serial" });

test.describe("mobile dictation capture smoke", () => {
  test.setTimeout(120_000);

  test("desktop setup → mobile G2 hub → Saisir → picker → B4 save", async ({
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
    await createDictationWithoutSave(page);

    await captureMobileDictationEntry(page);
  });
});
