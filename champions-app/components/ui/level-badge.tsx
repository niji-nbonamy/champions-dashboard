import { cva, type VariantProps } from "class-variance-authority";

import type { ChampionsLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const levelBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      level: {
        yellow: "bg-level-yellow text-level-yellow-foreground",
        green: "bg-level-green text-level-green-foreground",
        violet: "bg-level-violet text-level-violet-foreground",
        gold: "bg-level-gold text-level-gold-foreground",
      },
    },
    defaultVariants: {
      level: "yellow",
    },
  }
);

type LevelBadgeProps = {
  level: ChampionsLevel;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"span">, "children">;

function LevelBadge({
  level,
  className,
  children,
  ...props
}: LevelBadgeProps) {
  return (
    <span className={cn(levelBadgeVariants({ level }), className)} {...props}>
      {children ?? level}
    </span>
  );
}

export { LevelBadge, levelBadgeVariants };
export type { LevelBadgeProps };
