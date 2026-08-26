import {
  formatRosterImportSuccessMessage,
  ROSTER_CSV_ROSTER_EXISTS_ERROR,
} from "@/lib/domain/roster-import";
import { countActiveStudents } from "@/lib/services/count-active-students";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { listWordCountMatrixRows } from "@/lib/services/list-word-count-matrix-rows";
import { auth } from "@/auth";

import { CsvImportForm } from "./csv-import-form";
import { WordCountMatrixForm } from "./word-count-matrix-form";

type ConfigPageProps = {
  searchParams: Promise<{ imported?: string }>;
};

export default async function ConfigPage({ searchParams }: ConfigPageProps) {
  const session = await auth();
  const teacherId = session?.user?.id;
  const teacherClass = teacherId ? await getTeacherClass(teacherId) : null;
  const activeStudentCount = teacherClass
    ? await countActiveStudents(teacherClass.id)
    : 0;
  const matrixRows = teacherClass
    ? await listWordCountMatrixRows(teacherClass.id)
    : [];
  const matrixInitialRows = matrixRows.map((row) => ({
    label: row.dictationLabelKey,
    wordsYellow: String(row.wordsYellow),
    wordsGreen: String(row.wordsGreen),
    wordsViolet: String(row.wordsViolet),
    wordsGold: String(row.wordsGold),
  }));
  const params = await searchParams;
  const importedCount = Number.parseInt(params.imported ?? "", 10);
  const importedMessage =
    Number.isFinite(importedCount) && importedCount > 0
      ? formatRosterImportSuccessMessage(importedCount)
      : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Config</h1>
        <p className="text-sm text-muted-foreground">
          Importez votre liste d&apos;élèves pour configurer l&apos;année.
        </p>
      </div>

      {importedMessage ? (
        <p className="text-sm text-primary" role="status">
          {importedMessage}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Liste d&apos;élèves</h2>
        {activeStudentCount === 0 ? (
          <CsvImportForm />
        ) : (
          <p className="text-sm text-muted-foreground">
            {ROSTER_CSV_ROSTER_EXISTS_ERROR}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Matrice mots</h2>
        <p className="text-sm text-muted-foreground">
          Définissez le nombre de mots par dictée et par niveau couleur pour
          calculer les pourcentages globaux.
        </p>
        <WordCountMatrixForm initialRows={matrixInitialRows} />
      </section>
    </main>
  );
}
