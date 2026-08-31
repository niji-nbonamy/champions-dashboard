import { PromotionPlusButton } from "@/components/promotion/promotion-plus-button";
import type { PendingPromotionByStudent } from "@/lib/services/list-pending-promotions";

type GridPromotionCellProps = {
  firstName: string;
  pendingPromotion: PendingPromotionByStudent | null;
  isReadOnlyRow: boolean;
  disabled?: boolean;
  onOpen: (studentId: string) => void;
  studentId: string;
};

export function GridPromotionCell({
  firstName,
  pendingPromotion,
  isReadOnlyRow,
  disabled = false,
  onOpen,
  studentId,
}: GridPromotionCellProps) {
  if (!pendingPromotion || isReadOnlyRow) {
    return null;
  }

  return (
    <PromotionPlusButton
      ariaLabel={`Ouvrir la promotion pour ${firstName}`}
      disabled={disabled}
      onClick={() => onOpen(studentId)}
    />
  );
}
