"use client";

import { useCallback, useState } from "react";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import type { ChampionsLevel } from "@/lib/design/tokens";

import { PromotionDialog } from "./promotion-dialog";
import { PromotionPlusButton } from "./promotion-plus-button";
import { usePromotionAction } from "./use-promotion-action";

type RosterPromotionActionProps = {
  studentId: string;
  displayName: string;
  targetLevel: ChampionsLevel;
};

export function RosterPromotionAction({
  studentId,
  displayName,
  targetLevel,
}: RosterPromotionActionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isPending, handleValidate, handleRefuse } = usePromotionAction({
    validate: () => validateDossierPromotionAction(studentId),
    refuse: () => refuseDossierPromotionAction(studentId),
    onSuccess: () => setDialogOpen(false),
  });

  const closeDialog = useCallback(() => {
    if (isPending) {
      return;
    }

    setDialogOpen(false);
  }, [isPending]);

  return (
    <>
      <PromotionPlusButton
        ariaLabel={`Ouvrir la promotion pour ${displayName}`}
        disabled={isPending}
        onClick={() => setDialogOpen(true)}
      />
      <PromotionDialog
        open={dialogOpen}
        studentDisplayName={displayName}
        targetLevel={targetLevel}
        pending={isPending}
        onClose={closeDialog}
        onValidate={handleValidate}
        onRefuse={handleRefuse}
      />
    </>
  );
}
