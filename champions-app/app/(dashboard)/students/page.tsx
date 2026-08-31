import { Suspense } from "react";

import { auth } from "@/auth";
import { canArchiveStudents } from "@/lib/domain/year-start-readiness";
import { STUDENT_ARCHIVE_SUCCESS_MESSAGE } from "@/lib/domain/student-display-name";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { getYearStartWizardStatus } from "@/lib/services/get-year-start-wizard-status";
import {
  listClassStudents,
  type ClassStudentFilter,
} from "@/lib/services/list-class-students";
import { listPendingPromotionsForStudents } from "@/lib/services/list-pending-promotions";

import { AddStudentForm } from "./add-student-form";
import { RosterFilter } from "./roster-filter";
import { RosterList } from "./roster-list";

function parseRosterFilter(raw: string | string[] | undefined): ClassStudentFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (value === "archived" || value === "all") {
    return value;
  }

  return "active";
}

type StudentsPageProps = {
  searchParams: Promise<{
    filter?: string | string[];
    notice?: string | string[];
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const filter = parseRosterFilter(params.filter);
  const showArchiveSuccess =
    (Array.isArray(params.notice) ? params.notice[0] : params.notice) ===
    "archived";

  const session = await auth();
  const teacherId = session?.user?.id;
  const teacherClass = teacherId ? await getTeacherClass(teacherId) : null;
  const students =
    teacherClass !== null
      ? await listClassStudents(teacherClass.id, filter)
      : [];
  const pendingPromotionsByStudentId =
    teacherClass !== null && filter !== "archived"
      ? await listPendingPromotionsForStudents(
          teacherClass.id,
          students
            .filter((student) => student.archived !== true)
            .map((student) => student.id)
        )
      : {};
  const wizardStatus =
    teacherClass !== null
      ? await getYearStartWizardStatus(teacherClass.id)
      : null;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Élèves</h1>
        <p className="text-sm text-muted-foreground">
          Gérez la liste de votre classe.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Ajouter un élève</h2>
        <AddStudentForm />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium">Liste des élèves</h2>
          <Suspense fallback={null}>
            <RosterFilter current={filter} />
          </Suspense>
        </div>

        {showArchiveSuccess ? (
          <p className="text-sm text-muted-foreground" role="status">
            {STUDENT_ARCHIVE_SUCCESS_MESSAGE}
          </p>
        ) : null}

        <RosterList
          students={students}
          filter={filter}
          showArchiveAction={
            wizardStatus !== null && canArchiveStudents(wizardStatus)
          }
          pendingPromotionsByStudentId={pendingPromotionsByStudentId}
        />
      </section>
    </main>
  );
}
