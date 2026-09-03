"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { PresentationBrandLogo } from "@/components/dashboard/presentation-brand-logo";
import { DictationHistoryTable } from "@/components/dossier/dictation-history-table";
import { PresentationChartsRow } from "@/components/dossier/presentation-charts-row";
import { PresentationHighlights } from "@/components/dossier/presentation-highlights";
import { Button } from "@/components/ui/button";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { toCurvePoints } from "@/lib/domain/dossier-curve";
import type { StudentDictationHistoryEntry } from "@/lib/services/get-student-dictation-history";

type PresentationModeProps = {
  studentId: string;
  displayName: string;
  level: ChampionsLevel | null;
  history: StudentDictationHistoryEntry[];
};

const PRESENTATION_SCROLL_CLASS =
  "flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 pt-6 pb-[calc(var(--spacing-logo-presentation-height)+6rem)] lg:px-10 lg:pt-10 lg:pb-[calc(var(--spacing-logo-presentation-height)+3rem)]";

export function PresentationMode({
  studentId,
  displayName,
  level,
  history,
}: PresentationModeProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ariaLabel = `Mode RDV parents, ${displayName}`;
  const hasHistory = history.length > 0;
  const curvePoints = toCurvePoints(history);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    closeButtonRef.current?.focus();

    return () => {
      if (dialog?.open) {
        dialog.close();
      }
    };
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
      <div className={PRESENTATION_SCROLL_CLASS}>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-display">{displayName}</h1>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Fermer
          </Button>
        </div>

        <PresentationChartsRow
          history={history}
          curvePoints={curvePoints}
          hasHistory={hasHistory}
        />

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
