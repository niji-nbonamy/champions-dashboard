import Link from "next/link";

import { RosterPromotionAction } from "@/components/promotion/roster-promotion-action";
import { SpeechTherapyToggle } from "@/components/students/speech-therapy-toggle";
import { StudentNameWithSpeechTherapy } from "@/components/students/student-name-with-speech-therapy";
import { LevelBadge } from "@/components/ui/level-badge";
import { RequiredLevelBadge } from "@/components/ui/required-level-badge";
import { isChampionsLevel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { ClassStudentFilter } from "@/lib/services/list-class-students";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";
import { cn } from "@/lib/utils";

import { ArchiveStudentButton } from "./archive-student-button";
import { LevelDotPicker } from "./level-dot-picker";

type RosterListStudent = {
  id: string;
  displayName: string;
  level: string | null;
  hasSpeechTherapy?: boolean;
  archived?: boolean;
};

type RosterListProps = {
  students: RosterListStudent[];
  filter?: ClassStudentFilter;
  showLevelUi?: boolean;
  showSpeechTherapyUi?: boolean;
  showArchiveAction?: boolean;
  linkToStudentSheet?: boolean;
  pendingPromotionsByStudentId?: Record<string, PendingPromotionByStudent>;
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
  showSpeechTherapyUi = false,
  showArchiveAction = false,
  linkToStudentSheet = true,
  pendingPromotionsByStudentId = {},
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
        const pendingPromotion = pendingPromotionsByStudentId[student.id] ?? null;
        const hasSpeechTherapy = student.hasSpeechTherapy === true;

        return (
          <li key={student.id} className="flex overflow-hidden">
            <span
              aria-hidden="true"
              className={cn(
                "w-2 shrink-0 self-stretch",
                getLevelStripeClass(student.level)
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              {linkToStudentSheet ? (
                <Link
                  href={`/students/${student.id}`}
                  className="min-w-0 text-sm font-medium underline-offset-4 hover:underline"
                  aria-label={`Fiche de ${student.displayName}`}
                >
                  <StudentNameWithSpeechTherapy
                    displayName={student.displayName}
                    hasSpeechTherapy={hasSpeechTherapy}
                    showIndicatorIcon={!showSpeechTherapyUi || isArchived}
                  />
                </Link>
              ) : (
                <StudentNameWithSpeechTherapy
                  displayName={student.displayName}
                  hasSpeechTherapy={hasSpeechTherapy}
                  showIndicatorIcon={!showSpeechTherapyUi || isArchived}
                  className="min-w-0 text-sm font-medium"
                />
              )}
              <div className="flex flex-col items-start gap-2 sm:ml-auto sm:flex-row sm:items-center">
                {showSpeechTherapyUi && !isArchived ? (
                  <SpeechTherapyToggle
                    studentId={student.id}
                    hasSpeechTherapy={hasSpeechTherapy}
                  />
                ) : null}
                {showSpeechTherapyUi && !isArchived && showLevelUi ? (
                  <div
                    aria-hidden="true"
                    className="border-border w-full border-t sm:h-8 sm:w-px sm:border-t-0 sm:border-l"
                  />
                ) : null}
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
                {showLevelUi && !isArchived ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <div
                      aria-hidden="true"
                      className={cn(
                        "border-border hidden h-8 w-px sm:block",
                        pendingPromotion ? "border-l" : "border-l border-transparent"
                      )}
                    />
                    <div
                      className="flex size-8 items-center justify-center"
                      data-testid={`roster-promotion-slot-${student.id}`}
                    >
                      {pendingPromotion ? (
                        <RosterPromotionAction
                          studentId={student.id}
                          displayName={student.displayName}
                          targetLevel={pendingPromotion.targetLevel}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {!isArchived && showArchiveAction ? (
                  <ArchiveStudentButton
                    studentId={student.id}
                    displayName={student.displayName}
                    filter={filter}
                  />
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
