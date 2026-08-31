type PromotionPlusButtonProps = {
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
};

export function PromotionPlusButton({
  ariaLabel,
  disabled = false,
  onClick,
}: PromotionPlusButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-promotion-ready text-sm font-semibold text-promotion-ready-foreground outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    >
      +
    </button>
  );
}
