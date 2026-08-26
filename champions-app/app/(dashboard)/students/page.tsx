import { auth } from "@/auth";
import { getTeacherClass } from "@/lib/services/get-teacher-class";
import { listActiveStudents } from "@/lib/services/list-active-students";

import { AddStudentForm } from "./add-student-form";
import { RosterList } from "./roster-list";

export default async function StudentsPage() {
  const session = await auth();
  const teacherId = session?.user?.id;
  const teacherClass = teacherId ? await getTeacherClass(teacherId) : null;
  const students =
    teacherClass !== null
      ? await listActiveStudents(teacherClass.id)
      : [];

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Élèves</h1>
        <p className="text-sm text-muted-foreground">
          Gérez la liste active de votre classe.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Ajouter un élève</h2>
        <AddStudentForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Liste active</h2>
        <RosterList students={students} />
      </section>
    </main>
  );
}
