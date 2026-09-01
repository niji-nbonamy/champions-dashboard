"use client";

import { useCallback, useState } from "react";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import type { PendingPromotionQueueItem } from "@/lib/services/list-pending-promotion-queue";

import { PromotionDialog } from "./promotion-dialog";
import { usePromotionAction } from "./use-promotion-action";

type AlertsPromotionQueueProps = {
  items: PendingPromotionQueueItem[];
};

export function AlertsPromotionQueue({ items }: AlertsPromotionQueueProps) {
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const activeItem =
    items.find((item) => item.studentId === activeStudentId) ?? null;

  const { isPending, handleValidate, handleRefuse } = usePromotionAction({
    validate: async () => {
      if (!activeItem) {
        return { error: null };
      }

      return validateDossierPromotionAction(activeItem.studentId);
    },
    refuse: async () => {
      if (!activeItem) {
        return { error: null };
      }

      return refuseDossierPromotionAction(activeItem.studentId);
    },
    onSuccess: () => setActiveStudentId(null),
  });

  const closeDialog = useCallback(() => {
    if (isPending) {
      return;
    }

    setActiveStudentId(null);
  }, [isPending]);

  return (
    <>
      <ul
        className="divide-y divide-border rounded-lg border border-border"
        data-testid="alerts-promotion-queue"
      >
        {items.map((item) => (
          <li key={item.studentId}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Traiter la promotion de ${item.displayName}`}
              disabled={isPending}
              onClick={() => setActiveStudentId(item.studentId)}
            >
              <span className="text-sm font-medium">{item.displayName}</span>
              <span className="text-sm text-muted-foreground">
                Prêt à monter →{" "}
                {getChampionsLevelFrenchLabel(item.targetLevel)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {activeItem ? (
        <PromotionDialog
          open
          studentDisplayName={activeItem.displayName}
          targetLevel={activeItem.targetLevel}
          pending={isPending}
          onClose={closeDialog}
          onValidate={handleValidate}
          onRefuse={handleRefuse}
        />
      ) : null}
    </>
  );
}
