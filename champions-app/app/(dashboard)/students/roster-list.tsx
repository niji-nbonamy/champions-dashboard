import Link from "next/link";

import { LevelBadge } from "@/components/ui/level-badge";
import { RequiredLevelBadge } from "@/components/ui/required-level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import type { ClassStudentFilter } from "@/lib/services/list-class-students";

import { ArchiveStudentButton } from "./archive-student-button";
import { LevelDotPicker } from "./level-dot-picker";

type RosterListStudent = {
  id: string;
  displayName: string;
  level: string | null;
  archived?: boolean;
};

type RosterListProps = {
  students: RosterListStudent[];
  filter?: ClassStudentFilter;
  showLevelUi?: boolean;
  showArchiveAction?: boolean;
  linkToDossier?: boolean;
};

function getEmptyMessage(filter: ClassStudentFilter): string {
  if (filter === "archived") {
    return "Aucun élève archivé.";
  }

  if (filter === "all") {
    return "Aucun élève pour le moment.";
  }

  return "Aucun élève actif pour le moment.";
}

export function RosterList({
  students,
  filter = "active",
  showLevelUi = true,
  showArchiveAction = false,
  linkToDossier = true,
}: RosterListProps) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{getEmptyMessage(filter)}</p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {students.map((student) => {
        const isArchived = student.archived === true;

        return (
          <li
            key={student.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            {linkToDossier ? (
              <Link
                href={`/students/${student.id}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
                aria-label={`Dossier de ${student.displayName}`}
              >
                {student.displayName}
              </Link>
            ) : (
              <span className="text-sm font-medium">{student.displayName}</span>
            )}
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {showLevelUi ? (
                isArchived ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {student.level && isChampionsLevel(student.level) ? (
                      <LevelBadge level={student.level} />
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      Archivé
                    </span>
                  </div>
                ) : student.level && isChampionsLevel(student.level) ? (
                  <LevelDotPicker
                    studentId={student.id}
                    mode="override"
                    currentLevel={student.level}
                  />
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <RequiredLevelBadge />
                    <LevelDotPicker studentId={student.id} />
                  </div>
                )
              ) : null}
              {!isArchived && showArchiveAction ? (
                <ArchiveStudentButton
                  studentId={student.id}
                  displayName={student.displayName}
                  filter={filter}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
