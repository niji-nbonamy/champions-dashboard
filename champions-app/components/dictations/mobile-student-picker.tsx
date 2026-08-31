import Link from "next/link";

import { LevelBadge } from "@/components/ui/level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import { getStudentFirstName } from "@/lib/domain/student-display-name";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export type MobileStudentPickerStudent = {
  id: string;
  displayName: string;
  level: string;
};

type MobileStudentPickerProps = {
  dictationId: string;
  students: MobileStudentPickerStudent[];
  enteredStudentIds: string[];
  remainingCount: number;
};

const LEVEL_STRIPE_CLASSES: Record<ChampionsLevel, string> = {
  yellow: "bg-level-yellow",
  green: "bg-level-green",
  violet: "bg-level-violet",
  gold: "bg-level-gold",
};

function getLevelStripeClass(level: string): string {
  if (isChampionsLevel(level)) {
    return LEVEL_STRIPE_CLASSES[level];
  }

  return "bg-border";
}

function formatRemainingLabel(remainingCount: number): string {
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
}: MobileStudentPickerProps) {
  const enteredSet = new Set(enteredStudentIds);

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Aucun élève nivelé actif.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground" role="status">
        {formatRemainingLabel(remainingCount)}
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {students.map((student) => {
          const firstName = getStudentFirstName(student.displayName);
          const isEntered = enteredSet.has(student.id);
          const level = isChampionsLevel(student.level) ? student.level : null;

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
                className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3"
                aria-label={
                  isEntered
                    ? `${firstName}, saisi`
                    : `Saisir les erreurs pour ${firstName}`
                }
              >
                <span className="text-base font-medium">{firstName}</span>
                <div className="flex items-center gap-2">
                  {level ? <LevelBadge level={level} /> : null}
                  {isEntered ? (
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
