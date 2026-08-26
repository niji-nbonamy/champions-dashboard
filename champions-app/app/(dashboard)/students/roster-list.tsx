import { LevelBadge } from "@/components/ui/level-badge";
import { RequiredLevelBadge } from "@/components/ui/required-level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import type { ActiveStudent } from "@/lib/services/list-active-students";

import { LevelDotPicker } from "./level-dot-picker";

type RosterListProps = {
  students: ActiveStudent[];
  showLevelUi?: boolean;
};

export function RosterList({ students, showLevelUi = true }: RosterListProps) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun élève actif pour le moment.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {students.map((student) => (
        <li
          key={student.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-sm font-medium">{student.displayName}</span>
          {showLevelUi ? (
            student.level && isChampionsLevel(student.level) ? (
              <LevelBadge level={student.level} />
            ) : (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <RequiredLevelBadge />
                <LevelDotPicker studentId={student.id} />
              </div>
            )
          ) : null}
        </li>
      ))}
    </ul>
  );
}
