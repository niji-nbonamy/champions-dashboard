"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import type { ChampionsLevel } from "@/lib/design/tokens";
import { PROMOTION_REFUSE_GENERIC_ERROR, PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/domain/promotion-messages";

import { PromotionDialog } from "./promotion-dialog";
import { PromotionPlusButton } from "./promotion-plus-button";

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
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const closeDialog = useCallback(() => {
    if (isPending) {
      return;
    }

    setDialogOpen(false);
  }, [isPending]);

  const handleValidate = useCallback(() => {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await validateDossierPromotionAction(studentId);

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Niveau mis à jour.");
        setDialogOpen(false);
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
          router.refresh();
          return;
        }

        toast.success("Promotion refusée.");
        setDialogOpen(false);
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
