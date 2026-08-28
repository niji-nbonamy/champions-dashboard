"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
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

export function PromotionBanner({
  studentId,
  targetLevel,
}: PromotionBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const targetLevelLabel = getChampionsLevelFrenchLabel(targetLevel);

  const handleValidate = useCallback(() => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await validateDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
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
      }
    });
  }, [isPending, router, studentId]);

  const handleRefuse = useCallback(() => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await refuseDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
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
      }
    });
  }, [isPending, router, studentId]);

  return (
    <div
      role="alert"
      data-testid="promotion-banner"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-promotion-ready px-4 py-3 text-promotion-ready-foreground"
    >
      <p className="font-medium">Prêt à monter → {targetLevelLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} onClick={handleValidate}>
          {isPending ? "Validation…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleRefuse}
        >
          {isPending ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
