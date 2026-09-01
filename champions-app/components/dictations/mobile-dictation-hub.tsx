import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import {
  formatMobileHubCaptureAriaLabel,
  formatMobileHubSummaryAriaLabel,
  MOBILE_NO_LEVELED_STUDENTS_MESSAGE,
} from "@/lib/domain/mobile-dictation-messages";
import type { DictationCompletionSummary } from "@/lib/services/get-dictation-completion-summary";
import type { DictationRecord } from "@/lib/services/list-dictations";
import { cn } from "@/lib/utils";

const MOBILE_EMPTY_DICTATION_MESSAGE =
  "Créez votre première dictée depuis un ordinateur ou une tablette.";

const MOBILE_CLASS_SETUP_MESSAGE =
  "Utilisez un ordinateur ou une tablette pour configurer votre classe.";

type MobileDictationHubProps = {
  lastDictation?: DictationRecord;
  completionSummary?: DictationCompletionSummary;
  isClassSetupBlocked?: boolean;
};

export function MobileDictationHub({
  lastDictation,
  completionSummary,
  isClassSetupBlocked = false,
}: MobileDictationHubProps) {
  if (!lastDictation) {
    const statusMessage = isClassSetupBlocked
      ? MOBILE_CLASS_SETUP_MESSAGE
      : MOBILE_EMPTY_DICTATION_MESSAGE;

    return (
      <main
        className="flex flex-1 flex-col gap-4 p-6"
        aria-label="Hub dictée mobile"
      >
        <p className="text-sm text-muted-foreground" role="status">
          {statusMessage}
        </p>
      </main>
    );
  }

  const formattedDate = formatDictationDateForDisplay(lastDictation.dictationDate);
  const isComplete = completionSummary?.isComplete ?? false;
  const hasNoLeveledStudents = (completionSummary?.totalLeveledCount ?? 0) === 0;
  const showShortcuts = !isClassSetupBlocked && !hasNoLeveledStudents;

  return (
    <main
      className="flex flex-1 flex-col gap-6 p-6"
      aria-label="Hub dictée mobile"
    >
      {isComplete ? (
        <p className="text-sm font-medium text-primary" role="status">
          Dictée complète
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {lastDictation.label}
        </h1>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>
      {isClassSetupBlocked ? (
        <p className="text-sm text-muted-foreground" role="status">
          {MOBILE_CLASS_SETUP_MESSAGE}
        </p>
      ) : hasNoLeveledStudents ? (
        <p className="text-sm text-muted-foreground" role="status">
          {MOBILE_NO_LEVELED_STUDENTS_MESSAGE}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            href={`/dictations/${lastDictation.id}/mobile`}
            className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full")}
            aria-label={formatMobileHubCaptureAriaLabel(lastDictation.label)}
          >
            Saisir
          </Link>
          <Link
            href={`/dictations/${lastDictation.id}/mobile/summary`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 w-full"
            )}
            aria-label={formatMobileHubSummaryAriaLabel(lastDictation.label)}
          >
            Voir
          </Link>
        </div>
      )}
    </main>
  );
}
