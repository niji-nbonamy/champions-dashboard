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
  dictations?: DictationRecord[];
  completionSummariesByDictationId?: Record<string, DictationCompletionSummary>;
  isClassSetupBlocked?: boolean;
  hasNoLeveledStudents?: boolean;
};

export function MobileDictationHub({
  dictations = [],
  completionSummariesByDictationId = {},
  isClassSetupBlocked = false,
  hasNoLeveledStudents = false,
}: MobileDictationHubProps) {
  if (dictations.length === 0) {
    const statusMessage = isClassSetupBlocked
      ? MOBILE_CLASS_SETUP_MESSAGE
      : MOBILE_EMPTY_DICTATION_MESSAGE;

    return (
      <main
        className="flex flex-1 flex-col gap-4 p-6"
        aria-label="Hub dictée mobile"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Dictées</h1>
        <p className="text-sm text-muted-foreground" role="status">
          {statusMessage}
        </p>
      </main>
    );
  }

  const showShortcuts = !isClassSetupBlocked && !hasNoLeveledStudents;

  return (
    <main
      className="flex flex-1 flex-col gap-4 p-6"
      aria-label="Hub dictée mobile"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Dictées</h1>
      {isClassSetupBlocked ? (
        <p className="text-sm text-muted-foreground" role="status">
          {MOBILE_CLASS_SETUP_MESSAGE}
        </p>
      ) : hasNoLeveledStudents ? (
        <p className="text-sm text-muted-foreground" role="status">
          {MOBILE_NO_LEVELED_STUDENTS_MESSAGE}
        </p>
      ) : null}
      <section aria-label="Historique des dictées" className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {dictations.map((dictation) => {
            const completionSummary = completionSummariesByDictationId[dictation.id];
            const isComplete = completionSummary?.isComplete ?? false;
            const formattedDate = formatDictationDateForDisplay(
              dictation.dictationDate
            );

            return (
              <li
                key={dictation.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{dictation.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {formattedDate}
                  </span>
                  {isComplete ? (
                    <span
                      className="text-sm font-medium text-primary"
                      role="status"
                    >
                      Dictée complète
                    </span>
                  ) : null}
                </div>
                {showShortcuts ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/dictations/${dictation.id}/mobile`}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "min-h-11 w-full"
                      )}
                      aria-label={formatMobileHubCaptureAriaLabel(
                        dictation.label
                      )}
                    >
                      Saisir
                    </Link>
                    <Link
                      href={`/dictations/${dictation.id}/mobile/summary`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "min-h-11 w-full"
                      )}
                      aria-label={formatMobileHubSummaryAriaLabel(
                        dictation.label
                      )}
                    >
                      Voir
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
