"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { CurvePlaceholder } from "@/components/dossier/curve-placeholder";
import { DictationHistoryTable } from "@/components/dossier/dictation-history-table";
import { GlobalSuccessCurve } from "@/components/dossier/global-success-curve";
import { PresentationHighlights } from "@/components/dossier/presentation-highlights";
import { PresentationBrandLogo } from "@/components/dashboard/presentation-brand-logo";
import { Button } from "@/components/ui/button";
import { toCurvePoints } from "@/lib/domain/dossier-curve";
import { getStudentFirstName } from "@/lib/domain/student-display-name";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

type PresentationModeProps = {
  studentId: string;
  displayName: string;
  level: ChampionsLevel | null;
  history: StudentDictationHistoryEntry[];
};

export function PresentationMode({
  studentId,
  displayName,
  level,
  history,
}: PresentationModeProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstName = getStudentFirstName(displayName);
  const ariaLabel = `Mode RDV parents, ${firstName}`;
  const hasHistory = history.length > 0;
  const curvePoints = toCurvePoints(history);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  function handleClose() {
    dialogRef.current?.close();
    router.push(`/students/${studentId}`);
  }

  function handleDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    handleClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={ariaLabel}
      onCancel={handleDialogCancel}
      data-testid="presentation-mode-dialog"
      className="fixed inset-0 m-0 flex h-screen w-screen max-h-none max-w-none flex-col border-0 bg-background p-0 backdrop:bg-transparent open:flex"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-6 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-display">{displayName}</h1>
          <Button type="button" variant="outline" onClick={handleClose}>
            Fermer
          </Button>
        </div>

        <section aria-label="Courbe de réussite globale">
          {hasHistory ? (
            <GlobalSuccessCurve
              points={curvePoints}
              className="[&_svg]:h-72 [&_svg]:min-h-[320px]"
            />
          ) : (
            <CurvePlaceholder className="[&>div]:h-72 [&>div]:min-h-[320px]" />
          )}
        </section>

        <PresentationHighlights history={history} level={level} />

        {hasHistory ? (
          <details className="rounded-lg border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium">
              Détail par catégorie
            </summary>
            <div className="mt-4">
              <DictationHistoryTable entries={history} />
            </div>
          </details>
        ) : null}
      </div>

      <PresentationBrandLogo />
    </dialog>
  );
}
