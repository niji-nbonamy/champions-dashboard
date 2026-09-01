"use client";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import { Button } from "@/components/ui/button";
import { getChampionsLevelFrenchLabel } from "@/lib/domain/champions-level";
import type { ChampionsLevel } from "@/lib/design/tokens";

import { usePromotionAction } from "./use-promotion-action";

type PromotionBannerProps = {
  studentId: string;
  targetLevel: ChampionsLevel;
};

export function PromotionBanner({
  studentId,
  targetLevel,
}: PromotionBannerProps) {
  const targetLevelLabel = getChampionsLevelFrenchLabel(targetLevel);
  const { isPending, pendingAction, handleValidate, handleRefuse } =
    usePromotionAction({
      validate: () => validateDossierPromotionAction(studentId),
      refuse: () => refuseDossierPromotionAction(studentId),
    });

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
          disabled={isPending}
          onClick={handleValidate}
        >
          {pendingAction === "validate" ? "Validation…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleRefuse}
          className="border-promotion-ready-foreground/70 bg-transparent text-promotion-ready-foreground hover:bg-promotion-ready-foreground/15 hover:text-promotion-ready-foreground"
        >
          {pendingAction === "refuse" ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
