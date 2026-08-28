"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import { Button } from "@/components/ui/button";
import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";
import {
  PROMOTION_REFUSE_GENERIC_ERROR,
} from "@/lib/services/refuse-student-promotion";
import { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/services/validate-student-promotion";

type PromotionBannerProps = {
  studentId: string;
  targetLevel: ChampionsLevel;
};

type PendingPromotionAction = "validate" | "refuse";

export function PromotionBanner({
  studentId,
  targetLevel,
}: PromotionBannerProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] =
    useState<PendingPromotionAction | null>(null);
  const [, startTransition] = useTransition();
  const targetLevelLabel = getChampionsLevelFrenchLabel(targetLevel);

  const handleValidate = useCallback(() => {
    if (pendingAction) {
      return;
    }

    setPendingAction("validate");
    startTransition(async () => {
      try {
        const result = await validateDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Niveau mis à jour.");
        router.refresh();
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }

        toast.error(PROMOTION_VALIDATE_GENERIC_ERROR);
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }, [pendingAction, router, studentId]);

  const handleRefuse = useCallback(() => {
    if (pendingAction) {
      return;
    }

    setPendingAction("refuse");
    startTransition(async () => {
      try {
        const result = await refuseDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Promotion refusée.");
        router.refresh();
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }

        toast.error(PROMOTION_REFUSE_GENERIC_ERROR);
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }, [pendingAction, router, studentId]);

  return (
    <div
      role="alert"
      data-testid="promotion-banner"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-promotion-ready px-4 py-3 text-promotion-ready-foreground"
    >
      <p className="font-medium">Prêt à monter → {targetLevelLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pendingAction !== null}
          onClick={handleValidate}
        >
          {pendingAction === "validate" ? "Validation…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pendingAction !== null}
          onClick={handleRefuse}
          className="border-promotion-ready-foreground/70 bg-transparent text-promotion-ready-foreground hover:bg-promotion-ready-foreground/15 hover:text-promotion-ready-foreground"
        >
          {pendingAction === "refuse" ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
