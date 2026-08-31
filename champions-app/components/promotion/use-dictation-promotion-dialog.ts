"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  refusePromotionAction,
  validatePromotionAction,
} from "@/app/(dashboard)/dictations/actions";
import type { ChampionsLevel } from "@/lib/design/tokens";
import {
  PROMOTION_REFUSE_GENERIC_ERROR,
  PROMOTION_VALIDATE_GENERIC_ERROR,
} from "@/lib/domain/promotion-messages";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";

type PromotionStudentMeta = {
  id: string;
  displayName: string;
};

type UseDictationPromotionDialogOptions = {
  dictationId: string;
  studentMeta: PromotionStudentMeta[];
  pendingPromotionsByStudentId: Record<string, PendingPromotionByStudent>;
};

export function useDictationPromotionDialog({
  dictationId,
  studentMeta,
  pendingPromotionsByStudentId,
}: UseDictationPromotionDialogOptions) {
  const router = useRouter();
  const [promotionDialogStudentId, setPromotionDialogStudentId] = useState<
    string | null
  >(null);
  const [isPromotionPending, startPromotionTransition] = useTransition();

  const promotionDialogStudent = useMemo(() => {
    if (!promotionDialogStudentId) {
      return null;
    }

    const student = studentMeta.find(
      (entry) => entry.id === promotionDialogStudentId
    );
    const pending = pendingPromotionsByStudentId[promotionDialogStudentId];

    if (!student || !pending) {
      return null;
    }

    return {
      id: student.id,
      displayName: student.displayName,
      targetLevel: pending.targetLevel as ChampionsLevel,
    };
  }, [pendingPromotionsByStudentId, promotionDialogStudentId, studentMeta]);

  useEffect(() => {
    if (promotionDialogStudentId && !promotionDialogStudent) {
      setPromotionDialogStudentId(null);
    }
  }, [promotionDialogStudent, promotionDialogStudentId]);

  const closePromotionDialog = useCallback(() => {
    if (isPromotionPending) {
      return;
    }

    setPromotionDialogStudentId(null);
  }, [isPromotionPending]);

  const openPromotionDialog = useCallback((studentId: string) => {
    setPromotionDialogStudentId(studentId);
  }, []);

  const handlePromotionValidate = useCallback(() => {
    if (!promotionDialogStudentId || isPromotionPending) {
      return;
    }

    startPromotionTransition(async () => {
      try {
        const result = await validatePromotionAction(
          promotionDialogStudentId,
          dictationId
        );

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Niveau mis à jour.");
        setPromotionDialogStudentId(null);
        router.refresh();
      } catch {
        toast.error(PROMOTION_VALIDATE_GENERIC_ERROR);
        router.refresh();
      }
    });
  }, [dictationId, isPromotionPending, promotionDialogStudentId, router]);

  const handlePromotionRefuse = useCallback(() => {
    if (!promotionDialogStudentId || isPromotionPending) {
      return;
    }

    startPromotionTransition(async () => {
      try {
        const result = await refusePromotionAction(
          promotionDialogStudentId,
          dictationId
        );

        if (result.error) {
          toast.error(result.error);
          router.refresh();
          return;
        }

        toast.success("Promotion refusée.");
        setPromotionDialogStudentId(null);
        router.refresh();
      } catch {
        toast.error(PROMOTION_REFUSE_GENERIC_ERROR);
        router.refresh();
      }
    });
  }, [dictationId, isPromotionPending, promotionDialogStudentId, router]);

  const isPromotionBlocking =
    isPromotionPending || promotionDialogStudentId !== null;

  return {
    promotionDialogStudent,
    promotionDialogStudentId,
    isPromotionPending,
    isPromotionBlocking,
    openPromotionDialog,
    closePromotionDialog,
    handlePromotionValidate,
    handlePromotionRefuse,
  };
}
