"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  PROMOTION_REFUSE_GENERIC_ERROR,
  PROMOTION_VALIDATE_GENERIC_ERROR,
} from "@/lib/domain/promotion-messages";

export type PromotionActionResult = {
  error: string | null;
};

type UsePromotionActionOptions = {
  validate: () => Promise<PromotionActionResult>;
  refuse: () => Promise<PromotionActionResult>;
  onSuccess?: () => void;
};

export function usePromotionAction({
  validate,
  refuse,
  onSuccess,
}: UsePromotionActionOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<
    "validate" | "refuse" | null
  >(null);

  const runAction = useCallback(
    (
      actionKind: "validate" | "refuse",
      action: () => Promise<PromotionActionResult>,
      successMessage: string,
      genericError: string
    ) => {
      if (isPending) {
        return;
      }

      setPendingAction(actionKind);
      startTransition(async () => {
        try {
          const result = await action();

          if (result.error) {
            toast.error(result.error);
            router.refresh();
            return;
          }

          toast.success(successMessage);
          onSuccess?.();
          router.refresh();
        } catch (error) {
          if (isRedirectError(error)) {
            throw error;
          }

          toast.error(genericError);
          router.refresh();
        } finally {
          setPendingAction(null);
        }
      });
    },
    [isPending, onSuccess, router]
  );

  const handleValidate = useCallback(() => {
    runAction(
      "validate",
      validate,
      "Niveau mis à jour.",
      PROMOTION_VALIDATE_GENERIC_ERROR
    );
  }, [runAction, validate]);

  const handleRefuse = useCallback(() => {
    runAction(
      "refuse",
      refuse,
      "Promotion refusée.",
      PROMOTION_REFUSE_GENERIC_ERROR
    );
  }, [refuse, runAction]);

  return {
    isPending,
    pendingAction,
    handleValidate,
    handleRefuse,
  };
}
