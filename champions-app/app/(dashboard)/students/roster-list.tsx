import { LevelBadge } from "@/components/ui/level-badge";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { ActiveStudent } from "@/lib/services/list-active-students";

const CHAMPIONS_LEVELS = new Set<string>([
  "yellow",
  "green",
  "violet",
  "gold",
]);

function isChampionsLevel(level: string): level is ChampionsLevel {
  return CHAMPIONS_LEVELS.has(level);
}

type RosterListProps = {
  students: ActiveStudent[];
};

export function RosterList({ students }: RosterListProps) {
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
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="text-sm font-medium">{student.displayName}</span>
          {student.level && isChampionsLevel(student.level) ? (
            <LevelBadge level={student.level} />
          ) : (
            <span className="text-sm text-muted-foreground">
              Niveau non assigné
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
