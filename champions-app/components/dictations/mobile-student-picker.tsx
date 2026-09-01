import Link from "next/link";

import { LevelBadge } from "@/components/ui/level-badge";
import { RequiredLevelBadge } from "@/components/ui/required-level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export type MobileStudentPickerStudent = {
  id: string;
  displayName: string;
  level: string | null;
};

type MobileStudentPickerProps = {
  dictationId: string;
  students: MobileStudentPickerStudent[];
  enteredStudentIds: string[];
  remainingCount: number;
  leveledStudentCount: number;
};

const LEVEL_STRIPE_CLASSES: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow",
  green: "bg-level-green",
  violet: "bg-level-violet",
  gold: "bg-level-gold",
};

function getLevelStripeClass(level: string | null): string {
  if (level && isChampionsLevel(level)) {
    return LEVEL_STRIPE_CLASSES[level];
  }

  return "bg-border";
}

function formatRemainingLabel(
  remainingCount: number,
  leveledStudentCount: number
): string {
  if (leveledStudentCount === 0) {
    return "Aucun élève nivelé pour saisir.";
  }

  if (remainingCount <= 0) {
    return "Tous les élèves sont saisis";
  }

  if (remainingCount === 1) {
    return "1 restant";
  }

  return `${remainingCount} restants`;
}

export function MobileStudentPicker({
  dictationId,
  students,
  enteredStudentIds,
  remainingCount,
  leveledStudentCount,
}: MobileStudentPickerProps) {
  const enteredSet = new Set(enteredStudentIds);

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Aucun élève actif.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground" role="status">
        {formatRemainingLabel(remainingCount, leveledStudentCount)}
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {students.map((student) => {
          const isEntered = enteredSet.has(student.id);
          const level =
            student.level && isChampionsLevel(student.level)
              ? student.level
              : null;

          return (
            <li key={student.id} className="flex overflow-hidden">
              <span
                aria-hidden="true"
                className={cn(
                  "w-2 shrink-0 self-stretch",
                  getLevelStripeClass(student.level)
                )}
              />
              <Link
                href={`/dictations/${dictationId}/mobile/${student.id}`}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 py-3"
                aria-label={
                  level == null
                    ? `${student.displayName}, niveau requis`
                    : isEntered
                      ? `${student.displayName}, saisi`
                      : `Saisir les erreurs pour ${student.displayName}`
                }
              >
                <span className="min-w-0 flex-1 break-words text-base font-medium leading-snug">
                  {student.displayName}
                </span>
                <div className="flex shrink-0 items-center gap-2 self-center">
                  {level ? (
                    <LevelBadge level={level} />
                  ) : (
                    <RequiredLevelBadge />
                  )}
                  {level && isEntered ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      saisi
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
