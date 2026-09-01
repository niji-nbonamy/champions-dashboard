"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  refusePromotionAction,
  validatePromotionAction,
} from "@/app/(dashboard)/dictations/actions";
import type { ChampionsLevel } from "@/lib/design/tokens";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";

import { usePromotionAction } from "./use-promotion-action";

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
  const [promotionDialogStudentId, setPromotionDialogStudentId] = useState<
    string | null
  >(null);

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

  const {
    isPending: isPromotionPending,
    handleValidate: handlePromotionValidate,
    handleRefuse: handlePromotionRefuse,
  } = usePromotionAction({
    validate: () =>
      validatePromotionAction(promotionDialogStudentId!, dictationId),
    refuse: () => refusePromotionAction(promotionDialogStudentId!, dictationId),
    onSuccess: () => setPromotionDialogStudentId(null),
  });

  const closePromotionDialog = useCallback(() => {
    if (isPromotionPending) {
      return;
    }

    setPromotionDialogStudentId(null);
  }, [isPromotionPending]);

  const openPromotionDialog = useCallback((studentId: string) => {
    setPromotionDialogStudentId(studentId);
  }, []);

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
