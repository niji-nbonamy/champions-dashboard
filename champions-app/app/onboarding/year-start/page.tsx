import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import {
  getYearStartWizardStatus,
  type YearStartWizardStep,
} from "@/lib/services/get-year-start-wizard-status";
import { listActiveStudents } from "@/lib/services/list-active-students";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";

import { confirmLevelsStepAction } from "./actions";
import { StepLevels } from "./step-levels";
import { StepMatrix } from "./step-matrix";
import { StepRoster } from "./step-roster";
import { WizardShell } from "./wizard-shell";

type YearStartWizardPageProps = {
  searchParams: Promise<{ step?: string }>;
};

function parseRequestedStep(rawStep: string | undefined): YearStartWizardStep {
  const parsed = Number.parseInt(rawStep ?? "", 10);

  if (parsed === 2) {
    return 2;
  }

  if (parsed === 3) {
    return 3;
  }

  return 1;
}

export default async function YearStartWizardPage({
  searchParams,
}: YearStartWizardPageProps) {
  const session = await auth();
  const teacherId = session?.user?.id;

  if (!teacherId) {
    redirect("/login");
  }

  const teacherClass = await getTeacherClass(teacherId);
  if (!teacherClass) {
    redirect("/onboarding/class");
  }

  const status = await getYearStartWizardStatus(teacherClass.id);

  if (status.completed) {
    redirect("/dictations");
  }

  const params = await searchParams;
  const requestedStep = parseRequestedStep(params.step);

  if (requestedStep > status.step) {
    redirect(`/onboarding/year-start?step=${status.step}`);
  }

  const students = await listActiveStudents(teacherClass.id);
  const matrixRows = await listWordCountMatrixRows(teacherClass.id);
  const matrixInitialRows = matrixRows.map((row) => ({
    label: row.dictationLabelKey,
    wordsYellow: String(row.wordsYellow),
    wordsGreen: String(row.wordsGreen),
    wordsViolet: String(row.wordsViolet),
    wordsGold: String(row.wordsGold),
  }));

  const assignedCount = Math.max(
    0,
    status.activeStudentCount - status.unassignedCount
  );
  const canAdvanceFromLevels = status.unassignedCount === 0;
  const canFinish = status.matrixRowCount > 0;

  let backHref: string | undefined;
  let footer: React.ReactNode = null;

  if (requestedStep === 2) {
    backHref = "/onboarding/year-start?step=1";
    footer = (
      <form action={confirmLevelsStepAction}>
        <Button type="submit" variant="accent" disabled={!canAdvanceFromLevels}>
          Suivant
        </Button>
      </form>
    );
  } else if (requestedStep === 3) {
    backHref = "/onboarding/year-start?step=2";
  }

  let stepContent: React.ReactNode;

  if (requestedStep === 1) {
    stepContent = <StepRoster students={students} />;
  } else if (requestedStep === 2) {
    stepContent = (
      <StepLevels
        students={students}
        assignedCount={assignedCount}
        totalCount={status.activeStudentCount}
      />
    );
  } else {
    stepContent = (
      <StepMatrix initialRows={matrixInitialRows} canFinish={canFinish} />
    );
  }

  return (
    <WizardShell
      currentStep={requestedStep}
      backHref={backHref}
      footer={footer}
    >
      {stepContent}
    </WizardShell>
  );
}
