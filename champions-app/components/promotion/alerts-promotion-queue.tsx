"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import { PROMOTION_REFUSE_GENERIC_ERROR } from "@/lib/services/refuse-student-promotion";
import type { PendingPromotionQueueItem } from "@/lib/services/list-pending-promotion-queue";
import { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/services/validate-student-promotion";

import { PromotionDialog } from "./promotion-dialog";

type AlertsPromotionQueueProps = {
  items: PendingPromotionQueueItem[];
};

export function AlertsPromotionQueue({ items }: AlertsPromotionQueueProps) {
  const router = useRouter();
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeItem =
    items.find((item) => item.studentId === activeStudentId) ?? null;

  const closeDialog = useCallback(() => {
    if (isPending) {
      return;
    }

    setActiveStudentId(null);
  }, [isPending]);

  const handleValidate = useCallback(() => {
    if (!activeItem || isPending) {
      return;
    }

    const studentId = activeItem.studentId;

    startTransition(async () => {
      try {
        const result = await validateDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Niveau mis à jour.");
        setActiveStudentId(null);
        router.refresh();
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }

        toast.error(PROMOTION_VALIDATE_GENERIC_ERROR);
        router.refresh();
      }
    });
  }, [activeItem, isPending, router]);

  const handleRefuse = useCallback(() => {
    if (!activeItem || isPending) {
      return;
    }

    const studentId = activeItem.studentId;

    startTransition(async () => {
      try {
        const result = await refuseDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Promotion refusée.");
        setActiveStudentId(null);
        router.refresh();
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }

        toast.error(PROMOTION_REFUSE_GENERIC_ERROR);
        router.refresh();
      }
    });
  }, [activeItem, isPending, router]);

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
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Traiter la promotion de ${item.displayName}`}
              disabled={isPending}
              onClick={() => setActiveStudentId(item.studentId)}
            >
              <span className="font-medium">{item.displayName}</span>
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
