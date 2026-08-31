"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refuseDossierPromotionAction,
  validateDossierPromotionAction,
} from "@/app/(dashboard)/students/actions";
import { getStudentFirstName } from "@/lib/domain/student-display-name";
import type { ChampionsLevel } from "@/lib/design/tokens";
import {
  PROMOTION_REFUSE_GENERIC_ERROR,
} from "@/lib/services/refuse-student-promotion";
import { PROMOTION_VALIDATE_GENERIC_ERROR } from "@/lib/services/validate-student-promotion";

import { PromotionDialog } from "./promotion-dialog";

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
  const firstName = getStudentFirstName(displayName);

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
      <button
        type="button"
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-promotion-ready text-sm font-semibold text-promotion-ready-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Ouvrir la promotion pour ${firstName}`}
        disabled={isPending}
        onClick={() => setDialogOpen(true)}
      >
        +
      </button>
      <PromotionDialog
        open={dialogOpen}
        studentFirstName={firstName}
        targetLevel={targetLevel}
        pending={isPending}
        onClose={closeDialog}
        onValidate={handleValidate}
        onRefuse={handleRefuse}
      />
    </>
  );
}
