import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDictationDateForDisplay } from "@/lib/domain/dictation";
import type { DictationCompletionSummary } from "@/lib/services/get-dictation-completion-summary";
import type { DictationRecord } from "@/lib/services/list-dictations";
import { cn } from "@/lib/utils";

type MobileDictationHubProps = {
  lastDictation?: DictationRecord;
  completionSummary?: DictationCompletionSummary;
};

export function MobileDictationHub({
  lastDictation,
  completionSummary,
}: MobileDictationHubProps) {
  if (!lastDictation) {
    return (
      <main
        className="flex flex-1 flex-col gap-4 p-6"
        aria-label="Hub dictée mobile"
      >
        <p className="text-sm text-muted-foreground">
          Créez votre première dictée depuis un ordinateur ou une tablette.
        </p>
      </main>
    );
  }

  const formattedDate = formatDictationDateForDisplay(lastDictation.dictationDate);
  const isComplete = completionSummary?.isComplete ?? false;

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
      <div className="flex flex-col gap-3">
        <Link
          href={`/dictations/${lastDictation.id}/mobile`}
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full")}
        >
          Saisir
        </Link>
        <Link
          href={`/dictations/${lastDictation.id}/mobile/summary`}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 w-full"
          )}
        >
          Voir
        </Link>
      </div>
    </main>
  );
}
