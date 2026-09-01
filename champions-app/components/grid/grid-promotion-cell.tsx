import type { Ref } from "react";

import { PromotionPlusButton } from "@/components/promotion/promotion-plus-button";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";

type GridPromotionCellProps = {
  displayName: string;
  pendingPromotion: PendingPromotionByStudent | null;
  isReadOnlyRow: boolean;
  disabled?: boolean;
  onOpen: (studentId: string) => void;
  studentId: string;
  buttonRef?: Ref<HTMLButtonElement>;
  onTabForward?: () => void;
};

export function GridPromotionCell({
  displayName,
  pendingPromotion,
  isReadOnlyRow,
  disabled = false,
  onOpen,
  studentId,
  buttonRef,
  onTabForward,
}: GridPromotionCellProps) {
  if (!pendingPromotion || isReadOnlyRow) {
    return null;
  }

  return (
    <PromotionPlusButton
      ariaLabel={`Ouvrir la promotion pour ${displayName}`}
      disabled={disabled}
      onClick={() => onOpen(studentId)}
      buttonRef={buttonRef}
      onTabForward={onTabForward}
    />
  );
}
