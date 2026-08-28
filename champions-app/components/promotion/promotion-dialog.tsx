"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";

type PromotionDialogProps = {
  open: boolean;
  studentFirstName: string;
  targetLevel: ChampionsLevel;
  pending: boolean;
  onClose: () => void;
  onValidate: () => void;
  onRefuse: () => void;
};

export function PromotionDialog({
  open,
  studentFirstName,
  targetLevel,
  pending,
  onClose,
  onValidate,
  onRefuse,
}: PromotionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (pending) {
      return;
    }

    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  function handleDialogCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={handleDialogClick}
      onCancel={handleDialogCancel}
      className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50 open:flex"
    >
      <div className="flex w-full flex-col gap-4 p-6">
        <h2 id={titleId} className="text-lg font-medium">
          Prêt à monter → {getChampionsLevelFrenchLabel(targetLevel)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {studentFirstName} peut passer au niveau{" "}
          {getChampionsLevelFrenchLabel(targetLevel)}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={onValidate}>
            {pending ? "Validation…" : "Valider"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onRefuse}
          >
            {pending ? "Refus…" : "Refuser"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
