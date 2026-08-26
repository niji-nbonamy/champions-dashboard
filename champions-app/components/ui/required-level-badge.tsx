import { cn } from "@/lib/utils";

type RequiredLevelBadgeProps = {
  className?: string;
};

export function RequiredLevelBadge({ className }: RequiredLevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900",
        className
      )}
    >
      niveau requis
    </span>
  );
}
